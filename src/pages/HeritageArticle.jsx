import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeritageDetailLayout from '../components/HeritageDetailLayout';
import { loadHeritageArticle } from '../lib/heritageContentLoader';
import { HERITAGE_PROOF_LIST } from '../data/heritage/heritageProofsCatalog';

const PROOF_SLUGS = new Set(HERITAGE_PROOF_LIST.map((p) => p.slug));

const HeritageArticle = () => {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadHeritageArticle(slug).then((data) => {
      if (!cancelled) {
        setArticle(data);
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
      backTab={PROOF_SLUGS.has(slug) ? 'proofs' : 'apologetics'}
    />
  );
};

export default HeritageArticle;
