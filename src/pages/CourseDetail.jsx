import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle, Lock, Circle, Award } from 'lucide-react';
import { isCourseEligibleForCertificate } from '../lib/courseCertificates';
import PageHeader from '../components/PageHeader';
import { COURSE_MODULES } from '../data/courseModules';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { getNextIncompleteModuleInCourse } from '../lib/courseStats';
import { ArrowRight } from 'lucide-react';
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
      <div className="container">
        <p>{t('course_not_found')}</p>
        <Link to="/courses">{t('course_back')}</Link>
      </div>
    );
  }

  return (
    <div className="container course-detail animate-fade-in">
      <Link to="/courses" className="course-back btn btn-ghost btn-sm">
        <ArrowLeft size={18} />
        {t('course_back')}
      </Link>

      <PageHeader title={t(course.titleKey)} subtitle={t('course_detail_subtitle')} />

      <div className="course-detail-progress card">
        <p className="course-detail-progress-label">
          {t('course_progress_label', {
            done: completedCount,
            total: course.modules.length,
            percent: progressPercent,
          })}
        </p>
        <div className="course-detail-progress-bar">
          <div
            className="course-detail-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {nextModule && (
          <Link
            to={`/courses/${courseId}/module/${nextModule.moduleIndex}`}
            className="btn btn-primary course-detail-continue"
          >
            {progressPercent > 0 ? t('course_continue') : t('course_start')}
            <ArrowRight size={18} />
          </Link>
        )}
        {canClaimCertificate && (
          <Link to={`/courses/${courseId}/certificate`} className="btn btn-outline course-detail-cert">
            <Award size={18} />
            {t('certificate_claim')}
          </Link>
        )}
      </div>

      <div className="course-modules-list">
        {course.modules.map((mod) => {
          const locked = !mod.free && !isPremium();
          const done = isComplete(courseId, mod.index);
          return (
            <article
              key={mod.index}
              className={`card course-module-row ${locked ? 'locked' : ''} ${done ? 'done' : ''}`}
            >
              <div className="course-module-status">
                {done ? (
                  <CheckCircle size={22} color="var(--gold-bright)" />
                ) : locked ? (
                  <Lock size={20} />
                ) : (
                  <Circle size={20} />
                )}
              </div>
              <div className="course-module-content">
                <span className="course-module-index">
                  {t('course_module_label', { num: mod.index })}
                </span>
                <h3>{t(mod.titleKey)}</h3>
                <p className="text-muted">{t(mod.descKey)}</p>
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
  );
};

export default CourseDetail;
