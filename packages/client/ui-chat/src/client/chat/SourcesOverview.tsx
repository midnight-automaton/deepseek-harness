/** User-provided attachment list for the Session overview. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FileAttachmentRef, ImageAttachmentRef } from '@deepseek-ai/dsh-attachment'
import type { PropsLocale, PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import { FileTypeIcon, ImageLightbox } from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar-right/client'
import type { SteeringMessageNode, UserMessageNode } from '../contract/snapshot.ts'
import css from './SourcesOverview.module.css'

/** Browser image cache and sent-file preview actions stay with the Chat plugin. */
export interface SourcesOverviewInjected {
  imageUrl: (image: ImageAttachmentRef) => Promise<string>
  previewPastedText: (file: FileAttachmentRef) => Promise<string>
  openPastedText: (file: FileAttachmentRef) => void
}

/** Overview source content seat. */
export type SourcesOverviewProps = PropsRuntime<'sidebar.right.overview.sources'>
  & PropsLocale<'chat'> & InjectFace<SourcesOverviewInjected>

type Source =
  | { readonly key: string; readonly kind: 'image'; readonly image: ImageAttachmentRef }
  | { readonly key: string; readonly kind: 'file'; readonly file: FileAttachmentRef }

const PREVIEW_COUNT = 3

function isPastedText(file: FileAttachmentRef): boolean {
  return file.name === '粘贴的文本.txt' || file.name === 'Pasted text.txt'
}

function ImageSource({ image, imageUrl, t }: {
  image: ImageAttachmentRef
  imageUrl: SourcesOverviewInjected['imageUrl']
  t: SourcesOverviewProps['t']
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [preview, setPreview] = useState(false)
  const closePreview = useCallback(() => { setPreview(false) }, [])
  useEffect(() => {
    let active = true
    void imageUrl(image).then((value) => { if (active) setUrl(value) })
      .catch(() => { if (active) setUrl(null) })
    return () => { active = false }
  }, [image, imageUrl])
  const name = image.name ?? t('overview.image')
  return <>
    <button type="button" className={css.row} disabled={url === null}
      aria-label={t('overview.openImage', { name })} onClick={() => { setPreview(true) }}>
      {url === null ? <span className={css.placeholder} aria-hidden="true" />
        : <img className={css.thumbnail} src={url} alt="" />}
      <span className={css.name}>{name}</span>
    </button>
    {preview && url !== null && <ImageLightbox src={url} alt={name}
      labels={{ dialog: t('image.dialog'), close: t('image.close') }} onClose={closePreview} />}
  </>
}

function FileSource({ file, previewPastedText, openPastedText, t }: {
  file: FileAttachmentRef
  previewPastedText: SourcesOverviewInjected['previewPastedText']
  openPastedText: SourcesOverviewInjected['openPastedText']
  t: SourcesOverviewProps['t']
}) {
  const pasted = isPastedText(file)
  const [title, setTitle] = useState(pasted ? t('attachment.pastedText') : file.name)
  useEffect(() => {
    if (!pasted) return
    let active = true
    void previewPastedText(file).then((value) => { if (active) setTitle(value || t('attachment.pastedText')) })
      .catch(() => { if (active) setTitle(t('attachment.pastedText')) })
    return () => { active = false }
  }, [file, pasted, previewPastedText, t])
  const content = <>
    <FileTypeIcon path={file.name} className={css.fileIcon} />
    <span className={css.name} title={title}>{title}</span>
  </>
  return pasted
    ? <button type="button" className={css.row} aria-label={t('overview.openText', { name: title })}
      onClick={() => { openPastedText(file) }}>{content}</button>
    : <div className={css.row}>{content}</div>
}

/** List attached images and files from the currently loaded Chat history. */
export function SourcesOverview({ useConversation, imageUrl, previewPastedText, openPastedText, t }: SourcesOverviewProps) {
  const chat = useConversation(snapshot => snapshot.views.get('chat'))
  const [showAll, setShowAll] = useState(false)
  const sources = useMemo(() => {
    if (chat === undefined) return []
    const entries: Source[] = []
    for (const key of [...chat.order].reverse()) {
      const node = chat.nodes.get(key)
      if (node?.kind !== 'user' && node?.kind !== 'steering') continue
      const message = node.data as UserMessageNode | SteeringMessageNode
      message.content.forEach((block, index) => {
        if (block.type === 'image') entries.push({ key: `${key}:${index}`, kind: 'image', image: block.attachment })
        else if (block.type === 'file') entries.push({ key: `${key}:${index}`, kind: 'file', file: block.attachment })
      })
    }
    return entries
  }, [chat])

  if (sources.length === 0) return <p className={css.empty}>{t('overview.empty')}</p>
  const visible = showAll ? sources : sources.slice(0, PREVIEW_COUNT)
  return <>
    <ul className={css.list}>
      {visible.map(source => <li key={source.key}>
        {source.kind === 'image'
          ? <ImageSource image={source.image} imageUrl={imageUrl} t={t} />
          : <FileSource file={source.file} previewPastedText={previewPastedText}
            openPastedText={openPastedText} t={t} />}
      </li>)}
    </ul>
    {sources.length > PREVIEW_COUNT && <button type="button" className={css.more}
      aria-expanded={showAll} onClick={() => { setShowAll(value => !value) }}>
      {t(showAll ? 'overview.less' : 'overview.all', { count: sources.length })}
    </button>}
  </>
}
