import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Compass, Heart, Users, BookOpen } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import './About.css';

const pillars = [
  { icon: Compass, titleKey: 'about_pillar_1_title', descKey: 'about_pillar_1_desc' },
  { icon: Users, titleKey: 'about_pillar_2_title', descKey: 'about_pillar_2_desc' },
  { icon: BookOpen, titleKey: 'about_pillar_3_title', descKey: 'about_pillar_3_desc' },
  { icon: Heart, titleKey: 'about_pillar_4_title', descKey: 'about_pillar_4_desc' },
];

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="container about-page animate-fade-in">
      <PageHeader
        eyebrow={t('about_eyebrow')}
        title={t('about_title')}
        subtitle={t('about_intro')}
        centered
        showLogo
      />

      <section className="about-audience card">
        <h2 className="about-section-title">{t('about_audience_title')}</h2>
        <p className="about-lead about-audience-hook">{t('about_audience_hook')}</p>
        <div className="about-split">
          <div className="about-split-block">
            <span className="about-split-label">{t('about_audience_seekers_label')}</span>
            <p className="text-muted">{t('about_audience_seekers_desc')}</p>
          </div>
          <div className="about-split-divider" aria-hidden="true" />
          <div className="about-split-block">
            <span className="about-split-label">{t('about_audience_believers_label')}</span>
            <p className="text-muted">{t('about_audience_believers_desc')}</p>
          </div>
        </div>
      </section>

      <section className="about-mission card">
        <h2 className="about-section-title">{t('about_mission_title')}</h2>
        <p className="about-lead">{t('about_mission_lead')}</p>
        <p className="text-muted">{t('about_mission_body')}</p>
      </section>

      <section className="about-pillars">
        <h2 className="about-section-title text-center">{t('about_values_title')}</h2>
        <div className="about-pillars-grid">
          {pillars.map(({ icon: Icon, titleKey, descKey }) => (
            <article key={titleKey} className="card card-feature">
              <div className="card-feature-icon">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <h3>{t(titleKey)}</h3>
              <p>{t(descKey)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-cta cta-band">
        <h2>{t('about_cta_title')}</h2>
        <p>{t('about_cta_desc')}</p>
        <div className="about-cta-actions">
          <Link to="/library" className="btn btn-primary btn-lg">
            {t('home_cta_explore')}
            <ArrowRight size={18} />
          </Link>
          <Link to="/auth" className="btn btn-outline btn-lg">
            {t('layout_login')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
