import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, Users, ScrollText, ChevronRight } from 'lucide-react';
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

const TABS = [
  { id: 'timeline', icon: Clock, labelKey: 'heritage_tab_timeline' },
  { id: 'proofs', icon: ScrollText, labelKey: 'heritage_tab_proofs' },
  { id: 'apologetics', icon: Shield, labelKey: 'heritage_tab_apologetics' },
  { id: 'characters', icon: Users, labelKey: 'heritage_tab_characters' },
];

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

function HeritageEntryCta({ label }) {
  return (
    <span className="heritage-entry-cta">
      {label}
      <ChevronRight size={16} aria-hidden />
    </span>
  );
}

const Heritage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    TABS.some((tab) => tab.id === tabParam) ? tabParam : 'timeline',
  );
  const [proofFilter, setProofFilter] = useState('all');

  useEffect(() => {
    if (TABS.some((tab) => tab.id === tabParam)) {
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
    <div className="heritage-page animate-fade-in">
      <header className="heritage-hub-hero">
        <div className="heritage-hub-hero-glow" aria-hidden />
        <div className="heritage-hub-hero-inner container">
          <div className="heritage-hub-hero-mark">
            <HeritageLogo size={44} title={t('heritage')} />
          </div>
          <div className="heritage-hub-hero-copy">
            <p className="heritage-hub-hero-eyebrow">{t('heritage_page_eyebrow')}</p>
            <h1 className="heritage-hub-hero-title">{t('heritage')}</h1>
            <p className="heritage-hub-hero-subtitle">{t('heritage_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container heritage-hub-body">
        <nav className="heritage-hub-tabs" role="tablist" aria-label={t('heritage')}>
          {TABS.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`heritage-hub-tab ${activeTab === id ? 'heritage-hub-tab--active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={17} aria-hidden />
              <span>{t(labelKey)}</span>
            </button>
          ))}
        </nav>

        {activeTab === 'timeline' && (
          <section className="heritage-panel" role="tabpanel">
            <header className="heritage-panel-head">
              <h2 className="heritage-panel-title">{t('heritage_timeline_title')}</h2>
              <p className="heritage-panel-intro">
                {t('heritage_timeline_count', { count: HERITAGE_TIMELINE.length })}
              </p>
            </header>
            {HERITAGE_TIMELINE_ERAS.map((era) => {
              const items = timelineByEra[era];
              if (!items?.length) return null;
              return (
                <div key={era} className="heritage-era-block">
                  <h3 className="heritage-era-title">{t(ERA_LABEL_KEYS[era])}</h3>
                  <ul className="heritage-timeline-list">
                    {items.map((ev) => (
                      <li key={ev.slug}>
                        <Link
                          to={`/heritage/event/${ev.slug}`}
                          className="heritage-timeline-entry"
                        >
                          <span className="heritage-timeline-entry-year">{ev.year}</span>
                          <HeritageThumb
                            slug={ev.slug}
                            kind={ev.kind}
                            className="heritage-timeline-entry-thumb"
                          />
                          <div className="heritage-timeline-entry-body">
                            <h4 className="heritage-timeline-entry-title">{t(ev.titleKey)}</h4>
                            <p className="heritage-timeline-entry-desc">{t(ev.descKey)}</p>
                            <HeritageEntryCta label={t('heritage_read_more')} />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        )}

        {activeTab === 'proofs' && (
          <section className="heritage-panel" role="tabpanel">
            <header className="heritage-panel-head">
              <h2 className="heritage-panel-title">{t('heritage_proofs_title')}</h2>
              <p className="heritage-panel-intro">{t('heritage_proofs_intro')}</p>
            </header>
            <div className="heritage-filter-row" role="group" aria-label={t('heritage_proofs_title')}>
              <button
                type="button"
                className={`heritage-filter-chip ${proofFilter === 'all' ? 'heritage-filter-chip--active' : ''}`}
                onClick={() => setProofFilter('all')}
              >
                {t('heritage_proof_filter_all')}
              </button>
              {HERITAGE_PROOF_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`heritage-filter-chip ${proofFilter === cat ? 'heritage-filter-chip--active' : ''}`}
                  onClick={() => setProofFilter(cat)}
                >
                  {t(PROOF_CAT_KEYS[cat])}
                </button>
              ))}
            </div>
            <ul className="heritage-entry-grid">
              {filteredProofs.map((proof) => (
                <li key={proof.slug}>
                  <Link
                    to={`/heritage/article/${proof.slug}`}
                    className="heritage-entry heritage-entry--card"
                  >
                    <HeritageThumb slug={proof.slug} kind="proof" className="heritage-entry-thumb" />
                    <div className="heritage-entry-body">
                      <p className="heritage-entry-meta">{t(PROOF_CAT_KEYS[proof.category])}</p>
                      <h3 className="heritage-entry-title">{t(proof.titleKey)}</h3>
                      <p className="heritage-entry-desc">{t(proof.descKey)}</p>
                      <HeritageEntryCta label={t('heritage_read_article')} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'apologetics' && (
          <section className="heritage-panel" role="tabpanel">
            <header className="heritage-panel-head">
              <h2 className="heritage-panel-title">{t('heritage_apologetics_title')}</h2>
            </header>
            <ul className="heritage-entry-grid">
              {HERITAGE_ARTICLE_LIST.map((article) => (
                <li key={article.slug}>
                  <Link
                    to={`/heritage/article/${article.slug}`}
                    className="heritage-entry heritage-entry--card"
                  >
                    <HeritageThumb slug={article.slug} kind="article" className="heritage-entry-thumb" />
                    <div className="heritage-entry-body">
                      <h3 className="heritage-entry-title">{t(article.titleKey)}</h3>
                      <p className="heritage-entry-desc">{t(article.descKey)}</p>
                      <HeritageEntryCta label={t('heritage_read_article')} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === 'characters' && (
          <section className="heritage-panel" role="tabpanel">
            <header className="heritage-panel-head">
              <h2 className="heritage-panel-title">{t('heritage_characters_title')}</h2>
              <p className="heritage-panel-intro">{t('heritage_characters_intro')}</p>
            </header>
            <ul className="heritage-entry-grid heritage-entry-grid--portrait">
              {HERITAGE_CHARACTER_LIST.map((ch) => (
                <li key={ch.slug}>
                  <Link
                    to={`/heritage/character/${ch.slug}`}
                    className="heritage-entry heritage-entry--card heritage-entry--character"
                  >
                    <HeritageThumb slug={ch.slug} kind="character" className="heritage-entry-thumb heritage-entry-thumb--portrait" />
                    <div className="heritage-entry-body">
                      <p className="heritage-entry-meta">{t(ch.eraKey)}</p>
                      <h3 className="heritage-entry-title">{t(ch.titleKey)}</h3>
                      <p className="heritage-entry-role">{t(ch.roleKey)}</p>
                      <p className="heritage-entry-desc">{t(ch.descKey)}</p>
                      <HeritageEntryCta label={t('heritage_read_biography')} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

export default Heritage;
