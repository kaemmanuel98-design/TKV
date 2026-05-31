import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Unlock, BookOpen, GraduationCap, Headphones, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LibraryLogo } from '../components/SectionLogos';
import { useProfileStore } from '../store/useProfileStore';
import { BOOK_META } from '../data/bookMeta';
import { normalizeBookLang } from '../lib/bookLoader';
import { useBookProgressStore } from '../store/useBookProgressStore';
import PaywallModal from '../components/PaywallModal';
import './Library.css';

const BOOK_CATALOG = [
  {
    id: 1,
    slug: 'essence-foi',
    titleKey: 'lib_book_essence_title',
    authorKey: 'lib_book_author_aek',
    isPremium: false,
    readable: false,
    coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=Essence',
  },
  {
    id: 2,
    slug: 'gynosko',
    title: 'GYNOSKO',
    authorKey: 'lib_book_author_aek',
    isPremium: false,
    readable: true,
    coverUrl: '/covers/gynosko-cover.png',
  },
  {
    id: 4,
    slug: 'eido',
    title: 'EIDO',
    authorKey: 'lib_book_author_aek',
    isPremium: false,
    readable: true,
    coverUrl: '/covers/eido-cover.png',
  },
  {
    id: 3,
    slug: 'masque-foi',
    titleKey: 'lib_book_masque_title',
    authorKey: 'lib_book_author_aek',
    isPremium: true,
    readable: false,
    coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=Masque',
  },
];

function BookCard({ book, isPremiumUser, progressPercent, t, variant = 'featured' }) {
  const pct = book.readable ? progressPercent(book.slug) : 0;
  const locked = book.isPremium && !isPremiumUser;
  const hasProgress = pct > 0 && pct < 100;
  const isSoon = variant === 'soon';

  const action = !book.readable ? (
    <button type="button" className="btn btn-outline btn-sm w-full" disabled>
      {t('lib_coming_soon')}
    </button>
  ) : locked ? (
    <button type="button" className="btn btn-outline btn-sm w-full" disabled>
      <Lock size={16} aria-hidden />
      {t('lib_locked')}
    </button>
  ) : (
    <Link to={`/book/${book.slug}`} className="btn btn-primary btn-sm w-full">
      <BookOpen size={16} aria-hidden />
      {hasProgress ? t('lib_resume') : t('lib_read')}
      <ChevronRight size={16} aria-hidden />
    </Link>
  );

  return (
    <article className={`library-book ${isSoon ? 'library-book--soon' : ''}`}>
      <div className="library-book-cover">
        <img src={book.coverUrl} alt="" loading="lazy" />
        {locked && book.readable && (
          <div className="library-book-lock" aria-hidden>
            <Lock size={28} />
          </div>
        )}
      </div>
      <div className="library-book-body">
        <h3 className="library-book-title">{book.title}</h3>
        <p className="library-book-author">{book.author}</p>
        {!isSoon && book.description && (
          <p className="library-book-desc">{book.description}</p>
        )}
        {isSoon && book.isPremium && (
          <span className="library-book-badge library-book-badge--premium">
            <Lock size={12} aria-hidden />
            {t('course_premium_only')}
          </span>
        )}
        {isSoon && !book.isPremium && (
          <span className="library-book-badge">{t('lib_coming_soon')}</span>
        )}
        {hasProgress && !isSoon && (
          <>
            <p className="library-book-progress-label">
              {t('lib_progress_label', { percent: pct })}
            </p>
            <div className="library-book-progress" aria-hidden>
              <div className="library-book-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </>
        )}
        <div className="library-book-actions">{action}</div>
      </div>
    </article>
  );
}

const Library = () => {
  const { t, i18n } = useTranslation();
  const lang = normalizeBookLang(i18n.language);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const books = useMemo(
    () =>
      BOOK_CATALOG.map((book) => {
        const meta = BOOK_META[book.slug]?.langs?.[lang] || BOOK_META[book.slug]?.langs?.fr;
        return {
          ...book,
          title: book.titleKey ? t(book.titleKey) : book.title,
          author: t(book.authorKey),
          description:
            meta?.tagline ||
            meta?.subtitle ||
            (book.slug === 'gynosko' ? t('gynosko_library_desc') : null),
        };
      }),
    [lang, t],
  );

  const isPremiumUser = useProfileStore((s) => s.isPremium());
  const progressPercent = useBookProgressStore((s) => s.progressPercent);

  const availableBooks = books.filter((b) => b.readable);
  const soonBooks = books.filter((b) => !b.readable);

  return (
    <div className="library-page animate-fade-in">
      <header className="library-hero">
        <div className="library-hero-glow" aria-hidden />
        <div className="library-hero-inner container">
          <div className="library-hero-mark">
            <LibraryLogo size={44} title={t('library')} />
          </div>
          <div className="library-hero-copy">
            <p className="library-hero-eyebrow">{t('home_section_eyebrow')}</p>
            <h1 className="library-hero-title">{t('library')}</h1>
            <p className="library-hero-subtitle">{t('lib_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container library-body">
        <nav className="library-toolbar" aria-label={t('library')}>
          <Link to="/courses" className="library-toolbar-link">
            <GraduationCap size={16} aria-hidden />
            {t('course_page_title')}
          </Link>
          <Link to="/podcasts" className="library-toolbar-link">
            <Headphones size={16} aria-hidden />
            {t('podcast_page_title')}
          </Link>
          {!isPremiumUser && (
            <button
              type="button"
              className="btn btn-primary btn-sm library-toolbar-premium"
              onClick={() => setPaywallOpen(true)}
            >
              <Unlock size={16} aria-hidden />
              {t('lib_premium_btn')}
            </button>
          )}
        </nav>

        {availableBooks.length > 0 && (
          <section className="library-section" aria-labelledby="library-available-heading">
            <h2 id="library-available-heading" className="library-section-title">
              {t('lib_section_available')}
            </h2>
            <div className="library-featured">
              {availableBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isPremiumUser={isPremiumUser}
                  progressPercent={progressPercent}
                  t={t}
                  variant="featured"
                />
              ))}
            </div>
          </section>
        )}

        {soonBooks.length > 0 && (
          <section className="library-section" aria-labelledby="library-soon-heading">
            <h2 id="library-soon-heading" className="library-section-title">
              {t('lib_section_soon')}
            </h2>
            <div className="library-soon-grid">
              {soonBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isPremiumUser={isPremiumUser}
                  progressPercent={progressPercent}
                  t={t}
                  variant="soon"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Library;
