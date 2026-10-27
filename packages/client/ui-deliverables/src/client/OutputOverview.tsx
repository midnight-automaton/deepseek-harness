/** Session-wide output file list backed by the existing turn deliverables data. */
import { useMemo, useState } from 'react'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { FileTypeIcon } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import { basename } from '../presented.ts'
import { producedForClosing } from './turn-deliverables.ts'
import css from './OutputOverview.module.css'

/** The only action this projection owns: navigate to an existing file tab. */
export interface OutputOverviewInjected {
  openOutput: (sessionId: SessionId, cwd: string | undefined, path: string) => void
}

/** Content of the overview's output section. */
export type OutputOverviewProps = PropsRuntime<'sidebar.right.overview.outputs'>
  & PropsLocale<'deliverables'> & InjectFace<OutputOverviewInjected>

const PREVIEW_COUNT = 4

/** List unique output paths from currently loaded turns, newest first. */
export function OutputOverview({ sessionId, useConversation, useSessions, openOutput, t }: OutputOverviewProps) {
  const timeline = useConversation(snapshot => snapshot.views.get('chat')?.timeline)
  const cwd = useSessions(state => state.byId[sessionId]?.cwd)
  const [showAll, setShowAll] = useState(false)
  const files = useMemo(() => {
    if (timeline === undefined) return []
    const seen = new Set<string>()
    const paths: string[] = []
    for (const number of [...timeline.turnOrder].reverse()) {
      const delivery = timeline.turns.get(number)?.data.get('deliverables')
      if (delivery === undefined) continue
      for (const path of [...(delivery.presented?.map(file => file.path) ?? []), ...producedForClosing(delivery)]) {
        if (seen.has(path)) continue
        seen.add(path)
        paths.push(path)
      }
    }
    return paths
  }, [timeline])

  if (files.length === 0) return <p className={css.empty}>{t('overview.empty')}</p>
  const visible = showAll ? files : files.slice(0, PREVIEW_COUNT)
  return <>
    <ul className={css.list}>
      {visible.map(path => <li key={path}>
        <button type="button" className={css.row} title={path}
          aria-label={t('overview.open', { name: basename(path) })}
          onClick={() => { openOutput(sessionId, cwd, path) }}>
          <FileTypeIcon path={path} className={css.icon} />
          <span className={css.name}>{basename(path)}</span>
        </button>
      </li>)}
    </ul>
    {files.length > PREVIEW_COUNT && <button type="button" className={css.more}
      aria-expanded={showAll} onClick={() => { setShowAll(value => !value) }}>
      {t(showAll ? 'overview.less' : 'overview.all', { count: files.length })}
    </button>}
  </>
}
