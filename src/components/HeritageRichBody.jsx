import React from 'react';
import { useTranslation } from 'react-i18next';
import HeritageImg from './HeritageImg';
import { resolveHeritageImage } from '../lib/heritageMedia';

function HeritageFigure({ block, t, contentSlug, contentKind }) {
  const alt = block.altKey ? t(block.altKey) : block.alt || '';
  const imgSlug = block.slug || contentSlug;
  const { primary, fallback } = imgSlug
    ? resolveHeritageImage({ slug: imgSlug, kind: block.kind || contentKind })
    : resolveHeritageImage({ kind: contentKind });

  if (!primary && !fallback) {
    return (
      <figure className="heritage-figure heritage-figure--fallback">
        <div className="heritage-figure-placeholder" aria-hidden />
        {block.captionKey && <figcaption>{t(block.captionKey)}</figcaption>}
      </figure>
    );
  }

  return (
    <figure className="heritage-figure">
      <HeritageImg src={primary} fallback={fallback} alt={alt} />
      {block.captionKey && <figcaption>{t(block.captionKey)}</figcaption>}
    </figure>
  );
}

export default function HeritageRichBody({ blocks, contentSlug, contentKind = 'article' }) {
  const { t } = useTranslation();

  if (!blocks?.length) return null;

  return (
    <div className="heritage-rich-body">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={idx} className="heritage-h2">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className="heritage-h3">
                {block.text}
              </h3>
            );
          case 'p':
            return (
              <p key={idx}>{block.text}</p>
            );
          case 'quote':
            return (
              <blockquote key={idx} className="heritage-quote">
                <p>{block.text}</p>
                {block.source && <cite>{block.source}</cite>}
              </blockquote>
            );
          case 'list':
            return (
              <ul key={idx} className="heritage-list">
                {block.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          case 'img':
            return (
              <HeritageFigure
                key={idx}
                block={block}
                t={t}
                contentSlug={contentSlug}
                contentKind={contentKind}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
