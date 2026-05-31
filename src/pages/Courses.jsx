import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, Lock, CheckCircle, ChevronRight } from 'lucide-react';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { getNextIncompleteModuleInCourse } from '../lib/courseStats';
import './Courses.css';

const courses = [
  {
    id: 'foundations',
    titleKey: 'course_foundations_title',
    descKey: 'course_foundations_desc',
    modules: 8,
    free: true,
  },
  {
    id: 'apologetics',
    titleKey: 'course_apologetics_title',
    descKey: 'course_apologetics_desc',
    modules: 6,
    free: false,
  },
  {
    id: 'teleios',
    titleKey: 'course_teleios_title',
    descKey: 'course_teleios_desc',
    modules: 6,
    free: false,
  },
];

const Courses = () => {
  const { t } = useTranslation();
  const isPremium = useProfileStore((s) => s.isPremium);
  const completedCount = useCourseProgressStore((s) => s.completedCount);
  const completed = useCourseProgressStore((s) => s.completed);

  return (
    <div className="courses-page animate-fade-in">
      <header className="courses-hero">
        <div className="courses-hero-glow" aria-hidden />
        <div className="courses-hero-inner container">
          <div className="courses-hero-mark" aria-hidden>
            <GraduationCap size={28} strokeWidth={1.5} />
          </div>
          <div className="courses-hero-copy">
            <p className="courses-hero-eyebrow">{t('course_eyebrow')}</p>
            <h1 className="courses-hero-title">{t('course_page_title')}</h1>
            <p className="courses-hero-subtitle">{t('course_page_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container courses-body">
        <div className="courses-list">
          {courses.map(({ id, titleKey, descKey, modules, free }) => {
            const locked = !free && !isPremium();
            const done = completedCount(id);
            const progress = modules > 0 ? Math.round((done / modules) * 100) : 0;
            const next = getNextIncompleteModuleInCourse(id, completed);
            const courseHref =
              !locked && next
                ? `/courses/${id}/module/${next.moduleIndex}`
                : `/courses/${id}`;

            return (
              <article key={id} className={`courses-card ${locked ? 'is-locked' : ''}`}>
                <div className="courses-card-icon" aria-hidden>
                  {locked ? <Lock size={20} /> : <GraduationCap size={20} strokeWidth={1.5} />}
                </div>
                <div className="courses-card-body">
                  <h2 className="courses-card-title">{t(titleKey)}</h2>
                  <p className="courses-card-desc">{t(descKey)}</p>
                  <p className="courses-card-meta">
                    {t('course_modules_count', { count: modules })}
                    {free ? (
                      <>
                        {' · '}
                        <span className="courses-card-meta-badge">{t('course_free_badge')}</span>
                      </>
                    ) : null}
                  </p>
                  {!locked && progress > 0 && (
                    <div className="courses-card-progress" aria-hidden>
                      <div
                        className="courses-card-progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="courses-card-action">
                  {locked ? (
                    <span className="courses-card-locked">{t('course_premium_only')}</span>
                  ) : (
                    <Link to={courseHref} className="btn btn-outline btn-sm">
                      {progress > 0 ? t('course_continue') : t('course_start')}
                      <ChevronRight size={16} aria-hidden />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <aside className="courses-note">
          <CheckCircle size={20} aria-hidden />
          <p>{t('course_free_note')}</p>
        </aside>
      </div>
    </div>
  );
};

export default Courses;
