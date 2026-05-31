import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useCourseProgressStore } from '../store/useCourseProgressStore';
import { CERTIFICATE_COURSES } from '../lib/courseCertificates';
import { issueCourseCertificate, fetchCertificate } from '../lib/certificateSync';
import { COURSE_MODULES } from '../data/courseModules';
import './CourseCertificate.css';

const CourseCertificate = () => {
  const { courseId } = useParams();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const completed = useCourseProgressStore((s) => s.completed);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const course = COURSE_MODULES[courseId];
  const meta = CERTIFICATE_COURSES[courseId];
  const holderName = profile?.name || user?.user_metadata?.name || t('profile_guest');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!user?.id || !courseId) {
        setLoading(false);
        return;
      }

      const existing = await fetchCertificate(user.id, courseId);
      if (cancelled) return;

      if (existing) {
        setCertificate(existing);
        setLoading(false);
        return;
      }

      const result = await issueCourseCertificate({
        userId: user.id,
        courseSlug: courseId,
        holderName,
        completedMap: completed,
      });

      if (cancelled) return;

      if (result.certificate) {
        setCertificate(result.certificate);
      } else if (result.error === 'not_eligible') {
        setError('not_eligible');
      } else {
        setError(result.error || 'unknown');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, courseId, holderName, completed]);

  const handlePrint = () => window.print();

  if (!course || !meta) {
    return (
      <div className="container">
        <p>{t('course_not_found')}</p>
        <Link to="/courses">{t('course_back')}</Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container certificate-page">
        <p>{t('certificate_login_required')}</p>
        <Link to="/auth" className="btn btn-primary">
          {t('layout_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container certificate-page animate-fade-in">
      <Link to={`/courses/${courseId}`} className="btn btn-ghost btn-sm certificate-back">
        <ArrowLeft size={18} />
        {t('course_back')}
      </Link>

      {loading && (
        <p className="certificate-loading">
          <Loader2 size={22} className="spin" />
          {t('certificate_loading')}
        </p>
      )}

      {error === 'not_eligible' && (
        <div className="card certificate-error">
          <p>{t('certificate_not_eligible')}</p>
          <Link to={`/courses/${courseId}`} className="btn btn-primary">
            {t('course_continue')}
          </Link>
        </div>
      )}

      {error && error !== 'not_eligible' && (
        <div className="card certificate-error">
          <p>{t('certificate_error')}</p>
        </div>
      )}

      {certificate && (
        <article className="certificate-doc card" id="certificate-print">
          <div className="certificate-doc-border">
            <Award size={40} className="certificate-icon" aria-hidden="true" />
            <p className="certificate-eyebrow">{t('certificate_eyebrow')}</p>
            <h1>{t('certificate_title')}</h1>
            <p className="certificate-course">{t(course.titleKey)}</p>
            <p className="certificate-name">{certificate.holder_name || holderName}</p>
            <p className="certificate-body">{t('certificate_body')}</p>
            <p className="certificate-date">
              {t('certificate_issued', {
                date: new Date(certificate.issued_at).toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              })}
            </p>
            <p className="certificate-code">{certificate.certificate_code}</p>
            <p className="certificate-org">The Kingdom&apos;s Voice · TKV</p>
          </div>
          <div className="certificate-actions no-print">
            <button type="button" className="btn btn-primary" onClick={handlePrint}>
              <Download size={18} />
              {t('certificate_download')}
            </button>
          </div>
        </article>
      )}
    </div>
  );
};

export default CourseCertificate;
