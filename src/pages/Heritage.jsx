import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, Users, ScrollText, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { HeritageLogo } from '../components/SectionLogos';
import {
  HERITAGE_TIMELINE,
  HERITAGE_TIMELINE_ERAS,
  HERITAGE_ARTICLE_LIST,
  HERITAGE_CHARACTER_LIST,
  HERITAGE_PROOF_LIST,
  HERITAGE_PROOF_CATEGORIES,
} from '../data/heritage/heritageCatalog';
import HeritageImg from '../components/HeritageImg';
import { resolveHeritageImage } from '../lib/heritageMedia';
import './Heritage.css';

const TABS = ['timeline', 'proofs', 'apologetics', 'characters'];

const ERA_LABEL_KEYS = {
  origins: 'heritage_era_origins',
  patristic: 'heritage_era_patristic',
  medieval: 'heritage_era_medieval',
  reformation: 'heritage_era_reformation',
  modern: 'heritage_era_modern',
};

const PROOF_CAT_KEYS = {
  secular: 'heritage_proof_cat_secular',
  jewish: 'heritage_proof_cat_jewish',
  christian: 'heritage_proof_cat_christian',
  archaeology: 'heritage_proof_cat_archaeology',
  manuscript: 'heritage_proof_cat_manuscript',
  skeptic: 'heritage_proof_cat_skeptic',
};

function HeritageThumb({ slug, kind, className }) {
  const { primary, fallback } = resolveHeritageImage({ slug, kind });
  return (
    <HeritageImg src={primary} fallback={fallback} alt="" className={className} />
  );
}

const Heritage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    TABS.includes(tabParam) ? tabParam : 'timeline',
  );
  const [proofFilter, setProofFilter] = useState('all');

  useEffect(() => {
    if (TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const setTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const filteredProofs = useMemo(() => {
    if (proofFilter === 'all') return HERITAGE_PROOF_LIST;
    return HERITAGE_PROOF_LIST.filter((p) => p.category === proofFilter);
  }, [proofFilter]);

  const timelineByEra = useMemo(() => {
    const map = {};
    HERITAGE_TIMELINE_ERAS.forEach((era) => {
      map[era] = HERITAGE_TIMELINE.filter((e) => e.era === era);
    });
    return map;
  }, []);

  return (
    <div className="container animate-fade-in">
      <PageHeader
        eyebrow={t('heritage')}
        title={t('heritage')}
        subtitle={t('heritage_subtitle')}
        centered
        mark={<HeritageLogo size={52} title={t('heritage')} />}
      />

      <div className="heritage-hub-tabs">
        <button
          type="button"
          className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('timeline')}
        >
          <Clock size={18} /> {t('heritage_tab_timeline')}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'proofs' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('proofs')}
        >
          <ScrollText size={18} /> {t('heritage_tab_proofs')}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'apologetics' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('apologetics')}
        >
          <Shield size={18} /> {t('heritage_tab_apologetics')}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'characters' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setTab('characters')}
        >
          <Users size={18} /> {t('heritage_tab_characters')}
        </button>
      </div>

      {activeTab === 'timeline' && (
        <section>
          <h2 className="text-center section-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            {t('heritage_timeline_title')}
          </h2>
          <p className="text-center text-muted max-w-2xl mx-auto mt-2 mb-6">
            {t('heritage_timeline_count', { count: HERITAGE_TIMELINE.length })}
          </p>
          {HERITAGE_TIMELINE_ERAS.map((era) => {
            const items = timelineByEra[era];
            if (!items?.length) return null;
            return (
              <div key={era} className="heritage-era-block">
                <h3 className="heritage-era-title">{t(ERA_LABEL_KEYS[era])}</h3>
                <div className="heritage-timeline-list">
                  {items.map((ev) => (
                    <Link
                      key={ev.slug}
                      to={`/heritage/event/${ev.slug}`}
                      className="heritage-card-link"
                    >
                      <article className="card heritage-timeline-item">
                        <div className="heritage-timeline-item-year">{ev.year}</div>
                        <HeritageThumb slug={ev.slug} kind={ev.kind} className="heritage-timeline-item-thumb" />
                        <div className="heritage-timeline-item-text">
                          <span className="heritage-kind-badge">{ev.kind}</span>
                          <h3>{t(ev.titleKey)}</h3>
                          <p className="text-muted" style={{ margin: '0 0 0.75rem' }}>
                            {t(ev.descKey)}
                          </p>
                          <span className="btn btn-outline btn-sm">
                            {t('heritage_read_more')} <ArrowRight size={16} />
                          </span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {activeTab === 'proofs' && (
        <section>
          <h2 className="text-center section-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            {t('heritage_proofs_title')}
          </h2>
          <p className="text-center text-muted max-w-2xl mx-auto mt-2 mb-4">
            {t('heritage_proofs_intro')}
          </p>
          <div className="heritage-proof-filters">
            <button
              type="button"
              className={`btn btn-sm ${proofFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setProofFilter('all')}
            >
              {t('heritage_proof_filter_all')}
            </button>
            {HERITAGE_PROOF_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${proofFilter === cat ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setProofFilter(cat)}
              >
                {t(PROOF_CAT_KEYS[cat])}
              </button>
            ))}
          </div>
          <div className="heritage-card-grid heritage-card-grid--2 mt-6">
            {filteredProofs.map((proof) => (
              <Link
                key={proof.slug}
                to={`/heritage/article/${proof.slug}`}
                className="heritage-card-link"
              >
                <article className="card heritage-card">
                  <HeritageThumb slug={proof.slug} kind="proof" className="heritage-card-thumb" />
                  <div className="heritage-card-body">
                    <p className="heritage-card-meta">{t(PROOF_CAT_KEYS[proof.category])}</p>
                    <h3>{t(proof.titleKey)}</h3>
                    <p className="text-muted" style={{ margin: 0 }}>{t(proof.descKey)}</p>
                    <span className="btn btn-outline btn-sm mt-4" style={{ display: 'inline-flex' }}>
                      {t('heritage_read_article')} <ArrowRight size={16} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'apologetics' && (
        <section>
          <h2 className="text-center section-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            {t('heritage_apologetics_title')}
          </h2>
          <div className="heritage-card-grid heritage-card-grid--2 mt-6">
            {HERITAGE_ARTICLE_LIST.map((article) => (
              <Link
                key={article.slug}
                to={`/heritage/article/${article.slug}`}
                className="heritage-card-link"
              >
                <article className="card heritage-card">
                  <HeritageThumb slug={article.slug} kind="article" className="heritage-card-thumb" />
                  <div className="heritage-card-body">
                    <h3>{t(article.titleKey)}</h3>
                    <p className="text-muted" style={{ margin: 0 }}>{t(article.descKey)}</p>
                    <span className="btn btn-outline btn-sm mt-4" style={{ display: 'inline-flex' }}>
                      {t('heritage_read_article')} <ArrowRight size={16} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'characters' && (
        <section>
          <h2 className="text-center section-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            {t('heritage_characters_title')}
          </h2>
          <p className="text-center text-muted max-w-2xl mx-auto mt-2 mb-6">
            {t('heritage_characters_intro')}
          </p>
          <div className="heritage-card-grid heritage-card-grid--2">
            {HERITAGE_CHARACTER_LIST.map((ch) => (
              <Link
                key={ch.slug}
                to={`/heritage/character/${ch.slug}`}
                className="heritage-card-link"
              >
                <article className="card heritage-card">
                  <HeritageThumb slug={ch.slug} kind="character" className="heritage-character-portrait" />
                  <div className="heritage-card-body">
                    <p className="heritage-card-meta">{t(ch.eraKey)}</p>
                    <h3>{t(ch.titleKey)}</h3>
                    <p className="text-muted" style={{ margin: '0 0 0.25rem', fontSize: '0.9rem' }}>
                      {t(ch.roleKey)}
                    </p>
                    <p className="text-muted" style={{ margin: 0 }}>{t(ch.descKey)}</p>
                    <span className="btn btn-outline btn-sm mt-4" style={{ display: 'inline-flex' }}>
                      {t('heritage_read_biography')} <ArrowRight size={16} />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Heritage;
