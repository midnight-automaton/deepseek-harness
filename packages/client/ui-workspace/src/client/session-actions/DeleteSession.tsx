/** Permanent Session deletion, with a root-lifetime confirmation overlay. */
import { useState } from 'react'
import {
  Button, IconTrashOutlineRegular, MenuItemButton, Modal,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  DeleteSessionInjected, SessionDeleteDialogInjected, SessionDeleteDialogProps,
  SessionDeleteRequest, SessionMenuItemProps,
} from '../contract/slots.ts'
import css from '../rows/WorkspaceBrowser.module.css'

/** Ask for confirmation after closing the row menu. */
export function DeleteSessionMenuItem({
  sessionId, useMenuOpenState, requestSessionDelete, t,
}: SessionMenuItemProps<DeleteSessionInjected>) {
  const [, setMenuOpen] = useMenuOpenState()
  return (
    <MenuItemButton danger icon={<IconTrashOutlineRegular />} onSelect={() => {
      setMenuOpen(false)
      requestSessionDelete(sessionId)
    }}>
      {t('menu.deleteSession')}
    </MenuItemButton>
  )
}

/** Render the confirmation independently of the menu that raised it. */
export function SessionDeleteDialog({
  useDeleteRequest, settleSessionDelete, deleteSession, t,
}: SessionDeleteDialogProps) {
  const request = useDeleteRequest(pending => pending)
  if (request === null) return null
  return (
    <DeleteForm key={request.sessionId} request={request} onSettle={settleSessionDelete}
      deleteSession={deleteSession} t={t} />
  )
}

/** Keep the dialog open after a refusal so the user can read the next step. */
function DeleteForm({ request, onSettle, deleteSession, t }: {
  request: SessionDeleteRequest
  onSettle: () => void
  deleteSession: SessionDeleteDialogInjected['deleteSession']
  t: SessionDeleteDialogProps['t']
}) {
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<'active' | 'failed' | null>(null)
  const close = () => { if (!pending) onSettle() }
  const confirm = () => {
    if (pending) return
    setPending(true)
    setFailure(null)
    void deleteSession(request.sessionId).then((result) => {
      setPending(false)
      if (result.ok) onSettle()
      else setFailure(result.reason)
    })
  }
  return (
    <Modal open onClose={close} closeLabel={t('close')} title={t('delete.session.title')}
      description={t('delete.session.desc')}
      footer={(
        <>
          <Button variant="outline" disabled={pending} onClick={close}>{t('cancel')}</Button>
          <Button variant="outline" className={css.deleteAction} disabled={pending} onClick={confirm}>
            {t('delete.session.action')}
          </Button>
        </>
      )}>
      {pending && <div className={css.deleteStatus} role="status">{t('delete.session.pending')}</div>}
      {failure !== null && <div className={css.renameError} role="alert">
        {t(failure === 'active' ? 'delete.session.active' : 'delete.session.failed')}
      </div>}
    </Modal>
  )
}
