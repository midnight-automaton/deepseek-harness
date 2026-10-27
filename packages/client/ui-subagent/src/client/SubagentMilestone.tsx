import { memo } from 'react'
import { IconAgentPresetOutlineRegular, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { SubagentCatalogInjected } from './SubagentHeaderLineage.tsx'
import type { SubagentMilestoneData } from './subagent-milestone.ts'
import type { NS } from './locales.ts'
import css from './SubagentMilestone.module.css'

/** Parent Chat row backed by the direct-child catalog and live child status. */
export type SubagentMilestoneProps = PropsRuntime<'conversation.chat.node', 'subagent-milestone'>
  & SubagentCatalogInjected & PropsLocale<typeof NS>

/** Open a local child's full conversation while retaining its parent milestone. */
export const SubagentMilestone = memo(function SubagentMilestone({
  node, sessionId, useSessions, useSessionStatus, openChildAside, t,
}: SubagentMilestoneProps) {
  const data: SubagentMilestoneData = node.data
  const entry = useSessions(state => state.projectionsBySession[sessionId]?.values.subagentCatalog
    ?.find(item => item.id === data.childId))
  const summary = useSessions(state => state.byId[data.childId])
  const liveRunning = useSessionStatus(state => state.get(data.childId)?.running)
  if (entry === undefined) return null

  const label = entry.label ?? data.label ?? data.childId
  const external = entry.mode === 'external'
  const running = !external && (liveRunning ?? summary?.running) === true
  const completed = !external && !running
    && summary?.projectionValues?.subagentTiming?.lastTurnCompleted === true
  const status = external ? t('mode.external') : running ? t('activity.running')
    : completed ? t('activity.completed') : summary === undefined ? t('milestone.started')
      : t('activity.inactive')
  const content = (
    <>
      <span className={css.icon} aria-hidden><IconAgentPresetOutlineRegular size={14} /></span>
      <span className={css.label}>{label}</span>
      <span className={css.status}>{status}</span>
      {!external && <StateDot state={running ? 'ongoing' : completed ? 'done' : 'idle'} />}
    </>
  )

  return <div className={css.root} data-subagent-milestone={data.childId}>
    {external
      ? <span className={css.row}>{content}</span>
      : <button
        type="button"
        className={css.row}
        aria-label={t('open.sidebar.aria', { label })}
        onClick={() => { openChildAside({ parentSessionId: sessionId, childSessionId: data.childId, mode: entry.mode }) }}
      >{content}</button>}
  </div>
})
