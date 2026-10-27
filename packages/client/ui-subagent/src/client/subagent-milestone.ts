import type { ConversationNodeDefinition } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type { SubagentCatalogEvent } from '@deepseek-ai/dsh-subagent/src/catalog.ts'

/** A parent's durable record that a direct child was established. */
export interface SubagentMilestoneData {
  readonly childId: SessionId
  readonly mode: SubagentCatalogEvent['mode']
  readonly label?: string
  readonly seq: number
}

declare module '@deepseek-ai/dsh-client-ui-chat/client' {
  interface ChatNodeDataMap {
    /** Direct-child creation shown outside the parent turn's process disclosure. */
    'subagent-milestone': SubagentMilestoneData
  }
}

/** Project each parent catalog fact as a stable, independent Chat row. */
export const subagentMilestoneDefinition: ConversationNodeDefinition<SubagentMilestoneData> = {
  kind: 'subagent-milestone',
  target: 'chat',
  match: event => event.type === 'subagent/catalog'
    ? { id: String(event.data.childId), role: 'start' }
    : null,
  start: (_context, match) => {
    if (match.event.type !== 'subagent/catalog') {
      throw new Error('subagent milestone requires subagent/catalog')
    }
    const { childId, mode, label } = match.event.data
    return { childId, mode, ...(label === undefined ? {} : { label }), seq: match.event.seq }
  },
  update: context => context.state,
  buildViewNode: (context) => {
    if (context.state === undefined) return null
    return {
      key: context.key,
      kind: 'subagent-milestone',
      id: context.id,
      target: 'chat',
      anchorSeq: context.state.seq,
      location: context.start?.location ?? { kind: 'unresolved' },
      visibility: 'visible',
      groupTree: 'turn',
      data: context.state,
    }
  },
}
