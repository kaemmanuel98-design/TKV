import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Clock, ArrowRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Heritage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('timeline');

  const events = [
    { year: '33', titleKey: 'heritage_event_pentecost_title', descKey: 'heritage_event_pentecost_desc' },
    { year: '325', titleKey: 'heritage_event_nicaea_title', descKey: 'heritage_event_nicaea_desc' },
    { year: '1517', titleKey: 'heritage_event_reform_title', descKey: 'heritage_event_reform_desc' },
    { year: '1906', titleKey: 'heritage_event_azusa_title', descKey: 'heritage_event_azusa_desc' },
  ];

  const articles = [
    { slug: 'jesus', titleKey: 'heritage_article_jesus_title', descKey: 'heritage_article_jesus_desc' },
    {
      slug: 'manuscripts',
      titleKey: 'heritage_article_manuscripts_title',
      descKey: 'heritage_article_manuscripts_desc',
    },
  ];

  return (
    <div className="container animate-fade-in">
      <PageHeader
        eyebrow={t('heritage')}
        title={t('heritage')}
        subtitle={t('heritage_subtitle')}
        centered
        showLogo
      />

      <div className="flex justify-center gap-4 mb-8 flex-wrap">
        <button
          type="button"
          className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={18} /> {t('heritage_tab_timeline')}
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'apologetics' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('apologetics')}
        >
          <Shield size={18} /> {t('heritage_tab_apologetics')}
        </button>
      </div>

      {activeTab === 'timeline' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h2 className="text-center section-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            {t('heritage_timeline_title')}
          </h2>
          {events.map((ev) => (
            <div key={ev.year} className="card flex gap-4 items-start">
              <div style={{ minWidth: '72px', color: 'var(--gold)', fontWeight: 700, fontSize: '1.15rem' }}>
                {ev.year}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontFamily: 'var(--font-display)' }}>{t(ev.titleKey)}</h3>
                <p className="text-muted" style={{ margin: 0 }}>{t(ev.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'apologetics' && (
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h2 className="text-center section-title" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
            {t('heritage_apologetics_title')}
          </h2>
          {articles.map((article) => (
            <div key={article.slug} className="card">
              <h3 style={{ fontFamily: 'var(--font-display)' }}>{t(article.titleKey)}</h3>
              <p className="mt-2 text-muted">{t(article.descKey)}</p>
              <Link
                to={`/heritage/article/${article.slug}`}
                className="btn btn-outline btn-sm mt-4"
              >
                {t('heritage_read_article')} <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Heritage;
