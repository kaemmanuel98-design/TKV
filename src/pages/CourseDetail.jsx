import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Lock, Circle, Award, ChevronRight } from 'lucide-react';
import { isCourseEligibleForCertificate } from '../lib/courseCertificates';
import { COURSE_MODULES } from '../data/courseModules';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { getNextIncompleteModuleInCourse } from '../lib/courseStats';
import './CourseDetail.css';

const CourseDetail = () => {
  const { courseId } = useParams();
  const { t } = useTranslation();
  const isPremium = useProfileStore((s) => s.isPremium);
  const isComplete = useCourseProgressStore((s) => s.isComplete);
  const progressPercent = useCourseProgressStore((s) => s.progressPercent(courseId));
  const completedCount = useCourseProgressStore((s) => s.completedCount(courseId));
  const completed = useCourseProgressStore((s) => s.completed);
  const course = COURSE_MODULES[courseId];
  const nextModule = getNextIncompleteModuleInCourse(courseId, completed);
  const canClaimCertificate = isCourseEligibleForCertificate(courseId, completed);

  if (!course) {
    return (
      <div className="container course-not-found animate-fade-in">
        <p>{t('course_not_found')}</p>
        <Link to="/courses" className="course-back">
          <ArrowLeft size={18} aria-hidden />
          {t('course_back')}
        </Link>
      </div>
    );
  }

  return (
    <div className="course-detail-page animate-fade-in">
      <div className="container course-detail-top">
        <Link to="/courses" className="course-back">
          <ArrowLeft size={18} aria-hidden />
          {t('course_back')}
        </Link>
        <header className="course-detail-hero">
          <p className="course-detail-eyebrow">{t('course_eyebrow')}</p>
          <h1 className="course-detail-title">{t(course.titleKey)}</h1>
          <p className="course-detail-subtitle">{t('course_detail_subtitle')}</p>
        </header>
      </div>

      <div className="container course-detail-body">
        <section className="course-detail-progress" aria-label={t('course_progress_label', { done: completedCount, total: course.modules.length, percent: progressPercent })}>
          <p className="course-detail-progress-label">
            {t('course_progress_label', {
              done: completedCount,
              total: course.modules.length,
              percent: progressPercent,
            })}
          </p>
          <div className="course-detail-progress-bar" aria-hidden>
            <div
              className="course-detail-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="course-detail-actions">
            {nextModule && (
              <Link
                to={`/courses/${courseId}/module/${nextModule.moduleIndex}`}
                className="btn btn-primary"
              >
                {progressPercent > 0 ? t('course_continue') : t('course_start')}
                <ChevronRight size={18} aria-hidden />
              </Link>
            )}
            {canClaimCertificate && (
              <Link to={`/courses/${courseId}/certificate`} className="btn btn-outline">
                <Award size={18} aria-hidden />
                {t('certificate_claim')}
              </Link>
            )}
          </div>
        </section>

        <h2 className="course-modules-section-title">{t('course_modules_section')}</h2>
        <div className="course-modules-list">
          {course.modules.map((mod) => {
            const locked = !mod.free && !isPremium();
            const done = isComplete(courseId, mod.index);
            return (
              <article
                key={mod.index}
                className={`course-module-row ${locked ? 'is-locked' : ''} ${done ? 'is-done' : ''}`}
              >
                <div className="course-module-status" aria-hidden>
                  {done ? (
                    <CheckCircle size={20} />
                  ) : locked ? (
                    <Lock size={18} />
                  ) : (
                    <Circle size={18} />
                  )}
                </div>
                <div className="course-module-content">
                  <span className="course-module-index">
                    {t('course_module_label', { num: mod.index })}
                  </span>
                  <h3 className="course-module-title">{t(mod.titleKey)}</h3>
                  <p className="course-module-desc">{t(mod.descKey)}</p>
                </div>
                {!locked && (
                  <Link
                    to={`/courses/${courseId}/module/${mod.index}`}
                    className="btn btn-outline btn-sm"
                  >
                    {done ? t('course_module_review') : t('course_module_start')}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
