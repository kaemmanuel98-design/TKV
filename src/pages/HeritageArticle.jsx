import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeritageDetailLayout from '../components/HeritageDetailLayout';
import { HERITAGE_ARTICLES_CONTENT } from '../data/heritage/heritageArticlesContent';
import { HERITAGE_PROOFS_CONTENT } from '../data/heritage/heritageProofsContent';

const HeritageArticle = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const article = HERITAGE_ARTICLES_CONTENT[slug] || HERITAGE_PROOFS_CONTENT[slug];

  if (!article) {
    return (
      <div className="container">
        <p>{t('heritage_article_not_found')}</p>
        <Link to="/heritage?tab=proofs" className="btn btn-outline btn-sm">
          {t('heritage_back')}
        </Link>
      </div>
    );
  }

  return (
    <HeritageDetailLayout
      item={article}
      slug={slug}
      backPath="/heritage"
      backTab={
        HERITAGE_PROOFS_CONTENT[slug] ? 'proofs' : 'apologetics'
      }
    />
  );
};

export default HeritageArticle;
