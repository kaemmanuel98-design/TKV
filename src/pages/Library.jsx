import React from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { Lock, Unlock, Download, BookOpen, GraduationCap, Headphones } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import { LibraryLogo } from '../components/SectionLogos';
import { useProfileStore } from '../store/useProfileStore';

const books = [
  { id: 1, slug: 'essence-foi', title: "L'Essence de la Foi", author: 'A.E.K.', isPremium: false, coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=Essence' },
  { id: 2, slug: 'gynosko', title: 'GYNOSKO', author: 'Ange Emmanuel Kouamé', isPremium: false, coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=GYNOSKO' },
  { id: 3, slug: 'masque-foi', title: 'Le Masque de la Foi', author: 'Ange Emmanuel Kouamé', isPremium: true, coverUrl: 'https://placehold.co/300x440/121214/c9a962?text=Masque' },
];

const Library = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const isPremiumUser = useProfileStore((s) => s.isPremium());

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
              <button type="button" className="btn btn-primary btn-sm">
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
        {books.map((book) => (
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
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {book.author}
              </p>

              <div className="mt-auto flex gap-2">
                {book.isPremium && !isPremiumUser ? (
                  <button type="button" className="btn btn-outline w-full" disabled style={{ opacity: 0.6 }}>
                    <Lock size={16} /> {t('lib_locked')}
                  </button>
                ) : (
                  <>
                    <Link to={`/book/${book.slug}`} className="btn btn-primary" style={{ flex: 1 }}>
                      <BookOpen size={16} /> {t('lib_read')}
                    </Link>
                    <button type="button" className="btn btn-ghost" title={t('lib_download')} aria-label={t('lib_download')}>
                      <Download size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Library;
