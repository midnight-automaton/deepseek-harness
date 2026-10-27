/** Session overview chrome; data sections are supplied by their owning plugins. */
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import type { PropsLocale, PropsRenderSlots, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  IconChevronDownOutlineRegular, IconCloseOutlineRegular, IconFlatListOutlineRegular,
  MenuSurface, useAnchoredPosition,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import css from './OverviewAction.module.css'

type Section = 'outputs' | 'jobs' | 'sources'

/** The header utility and its three independently registered content seats. */
export type OverviewActionProps = PropsRuntime<'conversation.session.header.utilities'>
  & PropsLocale<'sidebarRight'>
  & PropsRenderSlots<
    'sidebar.right.overview.outputs' | 'sidebar.right.overview.jobs' | 'sidebar.right.overview.sources'
  >

const SECTION_ORDER: readonly Section[] = ['outputs', 'jobs', 'sources']
const MEASURE_STYLE: CSSProperties = { visibility: 'hidden', top: 0, left: 0 }
const MIN_AUTO_OVERVIEW_WIDTH = 1360

/** Show the current Session's outputs, processes, and sources beside its header. */
export function OverviewAction({ renderSlot, t }: OverviewActionProps) {
  const [open, setOpen] = useState(false)
  const [manuallyOpened, setManuallyOpened] = useState(false)
  const [folded, setFolded] = useState<Readonly<Record<Section, boolean>>>(
    { outputs: true, jobs: true, sources: false },
  )
  const [wide, setWide] = useState(() => window.innerWidth >= MIN_AUTO_OVERVIEW_WIDTH)
  const id = useId()
  const headerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const setRootRef = useCallback((element: HTMLDivElement | null) => {
    headerRef.current = element?.closest('header') ?? null
  }, [])
  useEffect(() => {
    const updateWidth = (): void => {
      setWide(window.innerWidth >= MIN_AUTO_OVERVIEW_WIDTH)
      setManuallyOpened(false)
    }
    window.addEventListener('resize', updateWidth)
    return () => { window.removeEventListener('resize', updateWidth) }
  }, [])
  const visible = open && (wide || manuallyOpened)
  const position = useAnchoredPosition({
    open: visible, anchorRef: headerRef, panelRef, align: 'end', gap: 14, margin: 12,
  })

  const close = (): void => {
    setOpen(false)
    setManuallyOpened(false)
    triggerRef.current?.focus()
  }
  const onPanelKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  return <div ref={setRootRef} className={css.root}>
    <button ref={triggerRef} type="button" className={css.trigger}
      aria-label={t(visible ? 'overview.close' : 'overview.open')} aria-expanded={visible}
      aria-controls={id} onClick={() => {
        if (visible) close()
        else { setOpen(true); setManuallyOpened(!wide) }
      }}>
      <IconFlatListOutlineRegular size={16} />
    </button>
    {visible && createPortal(
      <MenuSurface ref={panelRef} id={id} className={css.panel} style={position ?? MEASURE_STYLE}
        role="dialog" aria-label={t('overview.title')} onKeyDown={onPanelKeyDown}>
        <div className={css.sections}>
          {SECTION_ORDER.map((section) => {
            const label = t(`overview.${section}`)
            const collapsed = folded[section]
            return <section key={section} className={css.section}>
              <div className={css.sectionHeader}>
                <button type="button" className={css.sectionToggle} aria-expanded={!collapsed}
                  aria-label={t(collapsed ? 'overview.expand' : 'overview.collapse', { section: label })}
                  onClick={() => { setFolded(value => ({ ...value, [section]: !value[section] })) }}>
                  <span>{label}</span>
                  <IconChevronDownOutlineRegular size={12} className={collapsed ? css.chevronClosed : undefined} />
                </button>
                {section === 'outputs' && <div className={css.actions}>
                  <button type="button" className={css.tool} aria-label={t('overview.close')} onClick={close}>
                    <IconCloseOutlineRegular size={14} />
                  </button>
                </div>}
              </div>
              {!collapsed && <div className={css.sectionBody}>
                {section === 'outputs'
                  ? renderSlot('sidebar.right.overview.outputs', {},
                    { fallback: <p className={css.empty}>{t('overview.noOutputs')}</p> })
                  : section === 'jobs'
                    ? renderSlot('sidebar.right.overview.jobs', {},
                      { fallback: <p className={css.empty}>{t('overview.noJobs')}</p> })
                    : renderSlot('sidebar.right.overview.sources', {},
                      { fallback: <p className={css.empty}>{t('overview.noSources')}</p> })}
              </div>}
            </section>
          })}
        </div>
      </MenuSurface>, document.body,
    )}
  </div>
}
