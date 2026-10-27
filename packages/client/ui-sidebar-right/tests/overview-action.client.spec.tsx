// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { OverviewAction, type OverviewActionProps } from '../src/client/shell/OverviewAction.tsx'
import { zh } from '../src/client/locales.ts'

const originalWidth = window.innerWidth
beforeEach(() => { Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1440 }) })
afterEach(() => {
  cleanup()
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalWidth })
})

const props = {
  t: makeTranslate(zh),
  renderSlot: (name: string) => <span>{name}</span>,
} as OverviewActionProps

describe('session overview', () => {
  it('opens compactly, expands section seats independently, and dismisses with Escape', () => {
    render(<header><OverviewAction {...props} /></header>)
    fireEvent.click(screen.getByRole('button', { name: '打开会话摘要' }))
    const panel = screen.getByRole('dialog', { name: '会话摘要' })
    expect(panel.textContent).not.toContain('sidebar.right.overview.outputs')
    expect(panel.textContent).not.toContain('sidebar.right.overview.jobs')
    expect(panel.textContent).toContain('sidebar.right.overview.sources')
    fireEvent.click(screen.getByRole('button', { name: '展开输出内容' }))
    expect(panel.textContent).toContain('sidebar.right.overview.outputs')
    expect(panel.textContent).not.toContain('sidebar.right.overview.jobs')
    fireEvent.click(screen.getByRole('button', { name: '展开后台进程' }))
    expect(panel.textContent).toContain('sidebar.right.overview.jobs')
    fireEvent.keyDown(panel, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '会话摘要' })).toBeNull()
  })

  it('keeps the panel open while composing and after outside gestures until closed', () => {
    render(<><header><OverviewAction {...props} /></header><textarea aria-label="Composer" /></>)
    fireEvent.click(screen.getByRole('button', { name: '打开会话摘要' }))
    fireEvent.click(screen.getByRole('textbox', { name: 'Composer' }))
    fireEvent.pointerDown(document.body)
    expect(screen.getByRole('dialog', { name: '会话摘要' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '固定会话摘要' })).toBeNull()
    fireEvent.click(screen.getByRole('dialog', { name: '会话摘要' }).querySelector('button[aria-label="关闭会话摘要"]')!)
    expect(screen.queryByRole('dialog', { name: '会话摘要' })).toBeNull()
  })

  it('keeps its trigger at 1280px, lets a narrow user reopen it, and restores the prior panel on widening', () => {
    const width = window.innerWidth
    try {
      const { container } = render(<header><OverviewAction {...props} /></header>)
      const header = container.querySelector('header')
      if (header === null) throw new Error('missing test header')
      header.getBoundingClientRect = () => ({
        x: 280, y: 40, width: 1000, height: 50, top: 40, right: 1280, bottom: 90, left: 280,
        toJSON: () => ({}),
      })
      fireEvent.click(screen.getByRole('button', { name: '打开会话摘要' }))
      expect(screen.getByRole('dialog', { name: '会话摘要' }).style.top).toBe('104px')

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1280 })
      fireEvent.resize(window)
      expect(screen.queryByRole('dialog', { name: '会话摘要' })).toBeNull()
      fireEvent.click(screen.getByRole('button', { name: '打开会话摘要' }))
      expect(screen.getByRole('dialog', { name: '会话摘要' })).toBeTruthy()

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1140 })
      fireEvent.resize(window)
      expect(screen.queryByRole('dialog', { name: '会话摘要' })).toBeNull()
      expect(screen.getByRole('button', { name: '打开会话摘要' })).toBeTruthy()

      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
      fireEvent.resize(window)
      expect(screen.getByRole('dialog', { name: '会话摘要' }).style.top).toBe('104px')
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
    }
  })
})
