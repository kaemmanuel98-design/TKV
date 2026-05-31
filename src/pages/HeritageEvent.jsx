import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeritageDetailLayout from '../components/HeritageDetailLayout';
import { loadHeritageEvent } from '../lib/heritageContentLoader';

const HeritageEvent = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadHeritageEvent(slug).then((data) => {
      if (!cancelled) {
        setEvent(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="container">
        <p className="text-muted">{t('heritage_loading')}</p>
      </div>
    );
  }

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
