import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeritageDetailLayout from '../components/HeritageDetailLayout';
import { loadHeritageCharacter } from '../lib/heritageContentLoader';

const HeritageCharacter = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadHeritageCharacter(slug).then((data) => {
      if (!cancelled) {
        setCharacter(data);
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

  if (!character) {
    return (
      <div className="container">
        <p>{t('heritage_character_not_found')}</p>
        <Link to="/heritage?tab=characters" className="btn btn-outline btn-sm">
          {t('heritage_back')}
        </Link>
      </div>
    );
  }

  return (
    <HeritageDetailLayout
      item={character}
      slug={slug}
      backPath="/heritage"
      backTab="characters"
    />
  );
};

export default HeritageCharacter;
