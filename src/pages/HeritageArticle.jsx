import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { HERITAGE_ARTICLES } from '../data/heritageArticles';
import './HeritageArticle.css';

const HeritageArticle = () => {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const article = HERITAGE_ARTICLES[slug];

  if (!article) {
    return (
      <div className="container">
        <p>{t('heritage_article_not_found')}</p>
        <Link to="/heritage" className="btn btn-outline btn-sm">
          {t('heritage_back')}
        </Link>
      </div>
    );
  }

  const lang = ['fr', 'en'].includes(i18n.language.split('-')[0])
    ? i18n.language.split('-')[0]
    : 'fr';
  const paragraphs = article.sections[lang] || article.sections.fr;

  return (
    <div className="container heritage-article animate-fade-in">
      <Link to="/heritage" className="btn btn-ghost btn-sm heritage-article-back">
        <ArrowLeft size={18} />
        {t('heritage_back')}
      </Link>

      <PageHeader title={t(article.titleKey)} centered />

      <article className="card heritage-article-body">
        {paragraphs.map((para, idx) => (
          <p key={idx}>{para}</p>
        ))}
      </article>
    </div>
  );
};

export default HeritageArticle;
