import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Lock, Unlock, BookOpen, GraduationCap, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import { LibraryLogo } from '../components/SectionLogos';
import { useProfileStore } from '../store/useProfileStore';
import { BOOK_META } from '../data/bookMeta';
import { normalizeBookLang } from '../lib/bookLoader';
import { useBookProgressStore } from '../store/useBookProgressStore';
import PaywallModal from '../components/PaywallModal';

const BOOK_CATALOG = [
  { id: 1, slug: 'essence-foi', titleKey: 'lib_book_essence_title', authorKey: 'lib_book_author_aek', isPremium: false, readable: false, coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=Essence' },
  { id: 2, slug: 'gynosko', title: 'GYNOSKO', authorKey: 'lib_book_author_aek', isPremium: false, readable: true, coverUrl: '/covers/gynosko-cover.png' },
  { id: 4, slug: 'eido', title: 'EIDO', authorKey: 'lib_book_author_aek', isPremium: false, readable: true, coverUrl: '/covers/eido-cover.png' },
  { id: 3, slug: 'masque-foi', titleKey: 'lib_book_masque_title', authorKey: 'lib_book_author_aek', isPremium: true, readable: false, coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=Masque' },
];

const Library = () => {
  const { user } = useAuthStore();
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
          description: meta?.tagline || meta?.subtitle || (book.slug === 'gynosko' ? t('gynosko_library_desc') : null),
        };
      }),
    [lang, t],
  );
  const isPremiumUser = useProfileStore((s) => s.isPremium());
  const progressPercent = useBookProgressStore((s) => s.progressPercent);

  return (
    <div className="container animate-fade-in">
      <PageHeader
        eyebrow={t('home_section_eyebrow')}
        title={t('library')}
        subtitle={t('lib_subtitle')}
        mark={<LibraryLogo size={52} title={t('library')} />}
        actions={
          <>
            <Link to="/courses" className="btn btn-outline btn-sm">
              <GraduationCap size={16} />
              {t('course_page_title')}
            </Link>
            <Link to="/podcasts" className="btn btn-outline btn-sm">
              <Headphones size={16} />
              {t('podcast_page_title')}
            </Link>
            {!isPremiumUser ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setPaywallOpen(true)}
              >
                <Unlock size={16} /> {t('lib_premium_btn')}
              </button>
            ) : null}
          </>
        }
      />

      <div
        className="flex gap-6 flex-wrap"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {books.map((book) => {
          const pct = book.readable ? progressPercent(book.slug) : 0;
          const hasProgress = pct > 0 && pct < 100;
          return (
          <article key={book.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', aspectRatio: '3/4.4', overflow: 'hidden' }}>
              <img
                src={book.coverUrl}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {book.isPremium && !isPremiumUser && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(7, 7, 8, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <Lock size={32} color="var(--gold)" />
                </div>
              )}
            </div>
            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem', fontFamily: 'var(--font-display)' }}>
                {book.title}
              </h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.35rem' }}>
                {book.author}
              </p>
              {book.description && (
                <p className="text-muted" style={{ fontSize: '0.8125rem', marginBottom: '1rem', lineHeight: 1.45 }}>
                  {book.description}
                </p>
              )}
              {!book.description && <div style={{ marginBottom: '1rem' }} />}
              {hasProgress && (
                <>
                  <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.35rem' }}>
                    {t('lib_progress_label', { percent: pct })}
                  </p>
                  <div
                    className="profile-progress-bar"
                    style={{ marginBottom: '0.75rem', height: '4px' }}
                    aria-hidden="true"
                  >
                    <div className="profile-progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </>
              )}

              <div className="mt-auto flex gap-2">
                {!book.readable ? (
                  <button type="button" className="btn btn-outline w-full" disabled style={{ opacity: 0.65 }}>
                    {t('lib_coming_soon')}
                  </button>
                ) : book.isPremium && !isPremiumUser ? (
                  <button type="button" className="btn btn-outline w-full" disabled style={{ opacity: 0.6 }}>
                    <Lock size={16} /> {t('lib_locked')}
                  </button>
                ) : (
                  <Link to={`/book/${book.slug}`} className="btn btn-primary w-full">
                    <BookOpen size={16} /> {hasProgress ? t('lib_resume') : t('lib_read')}
                  </Link>
                )}
              </div>
            </div>
          </article>
          );
        })}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Library;
