import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeritageDetailLayout from '../components/HeritageDetailLayout';
import { HERITAGE_EVENTS_CONTENT } from '../data/heritage/heritageEventsContent';

const HeritageEvent = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const event = HERITAGE_EVENTS_CONTENT[slug];

  if (!event) {
    return (
      <div className="container">
        <p>{t('heritage_event_not_found')}</p>
        <Link to="/heritage?tab=timeline" className="btn btn-outline btn-sm">
          {t('heritage_back')}
        </Link>
      </div>
    );
  }

  return (
    <HeritageDetailLayout
      item={event}
      slug={slug}
      backPath="/heritage"
      backTab="timeline"
    />
  );
};

export default HeritageEvent;
