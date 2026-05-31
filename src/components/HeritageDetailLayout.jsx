import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import PageHeader from './PageHeader';
import HeritageRichBody from './HeritageRichBody';
import HeritageImg from './HeritageImg';
import { resolveHeritageImage } from '../lib/heritageMedia';
import { HERITAGE_TIMELINE } from '../data/heritage/heritageTimelineCatalog';
import { useHeritageBlocks } from '../hooks/useHeritageBlocks';
import '../pages/Heritage.css';

function resolveContentKind(item, slug) {
  if (item?.roleKey) return 'character';
  if (item?.category) return 'proof';
  const timeline = HERITAGE_TIMELINE.find((e) => e.slug === slug);
  if (timeline?.kind) return timeline.kind;
  if (item?.kind) return item.kind;
  const proofSlugs = new Set([
    'tacitus', 'josephus', 'pliny-trajan', 'suetonius', 'talmud-mentions',
    'early-creeds', 'early-martyrdom', 'pagan-critics', 'minimal-facts',
    'modern-skeptics', 'archaeology-proofs', 'manuscript-proofs',
  ]);
  if (slug && proofSlugs.has(slug)) return 'proof';
  return 'article';
}

export default function HeritageDetailLayout({ item, slug, backPath = '/heritage', backTab }) {
  const { t, i18n } = useTranslation();
  const { blocks, translating, translateError } = useHeritageBlocks(item.blocks, i18n, slug);
  const contentKind = resolveContentKind(item, slug);
  const { primary, fallback } = resolveHeritageImage({
    slug,
    kind: contentKind,
  });
  const heroAltKey = item.heroAltKey || item.portraitAltKey;

  const backUrl = backTab ? `${backPath}?tab=${backTab}` : backPath;

  return (
    <div className="container heritage-detail animate-fade-in">
      <Link to={backUrl} className="btn btn-ghost btn-sm heritage-detail-back">
        <ArrowLeft size={18} />
        {t('heritage_back')}
      </Link>

      {slug && (
        <div className="heritage-hero">
          <HeritageImg
            src={primary}
            fallback={fallback}
            alt={heroAltKey ? t(heroAltKey) : t(item.titleKey)}
            eager
          />
          <div className="heritage-hero-overlay" />
          {item.year && (
            <span className="heritage-hero-year">{item.year}</span>
          )}
        </div>
      )}

      <PageHeader
        title={t(item.titleKey)}
        subtitle={
          item.roleKey
            ? `${t(item.eraKey)} · ${t(item.roleKey)}`
            : item.eraKey
              ? t(item.eraKey)
              : undefined
        }
        centered={!slug}
      />

      <article className="card heritage-detail-body">
        {translating && (
          <p className="heritage-translate-notice" role="status">
            {t('content_translating')}
          </p>
        )}
        {translateError && !translating && (
          <p className="heritage-translate-notice" role="status">
            {t('content_translate_error')}
          </p>
        )}
        <HeritageRichBody blocks={blocks} contentSlug={slug} contentKind={contentKind} />
      </article>
    </div>
  );
}
