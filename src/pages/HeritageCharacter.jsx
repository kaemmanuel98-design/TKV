import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeritageDetailLayout from '../components/HeritageDetailLayout';
import { HERITAGE_CHARACTERS_CONTENT } from '../data/heritage/heritageCharactersContent';

const HeritageCharacter = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const character = HERITAGE_CHARACTERS_CONTENT[slug];

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
