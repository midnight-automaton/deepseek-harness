/** Compact background-process projection for the Session overview. */
import { useEffect, useState } from 'react'
import type { JobsSnapshot, JobView } from '@deepseek-ai/dsh-api-job-controller/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { IconChevronDownOutlineRegular, StateDot } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import css from './JobOverview.module.css'

/** Live roster and on-demand output are owned by the existing jobs service. */
export interface JobOverviewInjected {
  hooks: { jobs: { getSnapshot(): JobsSnapshot; subscribe(listener: () => void): () => void } }
  watchRows: (sessionId: SessionId) => () => void
  observe: (sessionId: SessionId, id: JobView['id']) => () => void
}

/** Overview content seat supplied by the jobs plugin. */
export type JobOverviewProps = PropsRuntime<'sidebar.right.overview.jobs'>
  & PropsLocale<'job'> & InjectFace<JobOverviewInjected>

/** Show this Session's job roster, with a live output preview on selection. */
export function JobOverview({ sessionId, useJobs, watchRows, observe, t }: JobOverviewProps) {
  const rows = useJobs(state => state.rows[sessionId])
  const observed = useJobs(state => state.observed)
  const [expanded, setExpanded] = useState<string | null>(null)
  useEffect(() => watchRows(sessionId), [sessionId, watchRows])
  const active = rows?.find(job => String(job.id) === expanded)
  useEffect(() => {
    if (active === undefined) return
    return observe(sessionId, active.id)
  }, [active, observe, sessionId])

  if (rows === undefined || rows.length === 0) return <p className={css.empty}>{t('overview.empty')}</p>
  return <ul className={css.list}>
    {rows.map((job) => {
      const key = String(job.id)
      const live = job.status === 'running' || job.status === 'stopping'
      const canInspect = live || job.output.total > 0
      const selected = expanded === key
      const content = <>
        <StateDot state={live ? 'ongoing' : job.status === 'completed' ? 'done' : 'warning'} />
        <span className={css.label} title={job.label}>{job.label}</span>
        <span className={css.status}>{t(`status.${job.status}`)}</span>
        {canInspect && <IconChevronDownOutlineRegular size={12} className={selected ? undefined : css.closed} />}
      </>
      return <li key={key}>
        {canInspect
          ? <button type="button" className={css.row} aria-expanded={selected}
            aria-label={t(selected ? 'row.collapseAria' : 'row.expandAria', { label: job.label })}
            onClick={() => { setExpanded(value => value === key ? null : key) }}>{content}</button>
          : <div className={css.row}>{content}</div>}
        {selected && canInspect && <pre className={css.output}>
          {observed[key]?.text || t('terminal.noOutput')}
        </pre>}
      </li>
    })}
  </ul>
}
