/** Session-authorized pasted-text preview in the existing right Sidebar. */
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { AttachmentIdType } from '@deepseek-ai/dsh-attachment'
import type { SessionFileAttachmentValue } from '@deepseek-ai/dsh-api-session-controller/types'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import css from './PastedTextTab.module.css'

/** The page kind and keyed slot identity owned by Chat. */
export const PASTED_TEXT_KIND = 'pastedText'
export const PASTED_TEXT_ID = '@deepseek-ai/dsh-client-ui-chat/pasted-text'

declare module '@deepseek-ai/dsh-client-ui-sidebar-right/client' {
  interface SidebarRightTabParamsMap {
    /** Durable file selected from one user message. */
    pastedText: { readonly sessionId: SessionId; readonly attachmentId: AttachmentIdType }
  }
}

/**
 * Decode the verified UTF-8 prefix returned by the Session Remote.
 * @param value - authorized file data.
 * @returns the readable text prefix.
 */
export function pastedTextOf(value: SessionFileAttachmentValue): string {
  const bytes = Uint8Array.from(atob(value.data), char => char.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

/**
 * Render original pasted text with line numbers and an explicit partial-read notice.
 * @param props - tab navigation, authorized reader, and localized copy.
 * @returns the text preview or a read status.
 */
export function PastedTextTab({ sessionId, useTabInfo, readPastedText, t }:
  PropsRuntime<'sidebar.right.pane.tab'> & PropsLocale<'chat'> & {
    readonly readPastedText: (sessionId: SessionId, attachmentId: AttachmentIdType,
      maxBytes: number) => Promise<SessionFileAttachmentValue>
  }): ReactNode {
  const { tab } = useTabInfo()
  const params = tab.navigation.params
  const attachmentId = params !== undefined && 'attachmentId' in params ? params.attachmentId : undefined
  const [state, setState] = useState<{ text: string; truncated: boolean; error: boolean } | null>(null)
  useEffect(() => {
    if (attachmentId === undefined) return
    let active = true
    setState(null)
    void readPastedText(sessionId, attachmentId, 1_048_576)
      .then((value) => { if (active) setState({ text: pastedTextOf(value), truncated: value.truncated, error: false }) })
      .catch(() => { if (active) setState({ text: '', truncated: false, error: true }) })
    return () => { active = false }
  }, [attachmentId, readPastedText, sessionId, tab.navigation.revision])
  if (attachmentId === undefined) return <div className={css.status}>{t('attachment.unavailable')}</div>
  if (state === null) return <div className={css.status}>{t('attachment.loading')}</div>
  if (state.error) return <div className={css.status}>{t('attachment.failed')}</div>
  const lines = state.text.split('\n')
  return <div className={css.root}>
    {state.truncated && <div className={css.notice}>{t('attachment.truncated')}</div>}
    {lines.length > 5_000 ? <pre className={css.largeText}>{state.text}</pre>
      : <div className={css.lines}>{lines.map((line, index) => <div className={css.line} key={index}>
        <span className={css.number} aria-hidden="true">{index + 1}</span>
        <span className={css.text}>{line}</span>
      </div>)}</div>}
  </div>
}
