import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Flame, TrendingUp, MessageCircle, Sparkles } from 'lucide-react';
import MimshackLogo from './MimshackLogo';
import { useGamificationStore } from '../store/useGamificationStore';
import { useBookProgressStore } from '../store/useBookProgressStore';
import { useProfileStore } from '../store/useProfileStore';
import './HomeDashboard.css';

const HomeDashboard = () => {
  const { t } = useTranslation();
  const profile = useProfileStore((s) => s.profile);
  const {
    streakCurrent,
    streakBest,
    checkInToday,
    hasCheckedInToday,
  } = useGamificationStore();
  const gynoskoPct = useBookProgressStore((s) => s.progressPercent('gynosko'));
  const eidoPct = useBookProgressStore((s) => s.progressPercent('eido'));
  const readingPct = Math.max(gynoskoPct, eidoPct);

  const checkedInToday = hasCheckedInToday();
  const userType = profile?.user_type || 'curious';
  const tipKey = `dashboard_ia_tip_${userType}`;

  return (
    <section className="container home-dashboard-section" aria-labelledby="home-dashboard-heading">
      <h2 id="home-dashboard-heading" className="home-dashboard-title">
        {t('dashboard_quick_title')}
      </h2>

      <div className="home-dashboard-grid">
        <article className="card home-dashboard-stat">
          <div className="home-dashboard-stat-head">
            <Flame size={18} aria-hidden="true" />
            <span>{t('dashboard_streak_label')}</span>
          </div>
          <p className="home-dashboard-stat-value">
            {streakCurrent === 1
              ? t('dashboard_streak_days', { count: streakCurrent })
              : t('dashboard_streak_days_plural', { count: streakCurrent })}
          </p>
          {streakBest > 0 && (
            <p className="home-dashboard-stat-meta">{t('dashboard_streak_record', { count: streakBest })}</p>
          )}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={checkedInToday}
            onClick={() => checkInToday()}
          >
            {checkedInToday ? t('dashboard_checkin_done') : t('dashboard_checkin')}
          </button>
        </article>

        <article className="card home-dashboard-stat">
          <div className="home-dashboard-stat-head">
            <TrendingUp size={18} aria-hidden="true" />
            <span>{t('dashboard_progress_label')}</span>
          </div>
          <p className="home-dashboard-stat-value">{t('dashboard_progress_value', { percent: readingPct })}</p>
          <div className="home-dashboard-progress" aria-hidden="true">
            <div className="home-dashboard-progress-fill" style={{ width: `${readingPct}%` }} />
          </div>
          {readingPct < 100 && (
            <Link to="/library" className="btn btn-ghost btn-sm">
              {t('home_path_library_title')}
            </Link>
          )}
        </article>

        <Link to="/cells" className="card home-dashboard-feature home-dashboard-feature--live">
          <span className="home-dashboard-badge">{t('dashboard_live_badge')}</span>
          <MessageCircle size={22} aria-hidden="true" />
          <h3>{t('dashboard_live_title')}</h3>
          <p>{t('dashboard_live_desc')}</p>
          <span className="home-dashboard-cta">{t('dashboard_live_cta')}</span>
        </Link>

        <Link to="/agent" className="card home-dashboard-feature home-dashboard-feature--ia">
          <MimshackLogo size={28} />
          <h3>{t('dashboard_ia_title')}</h3>
          <p>{t('dashboard_ia_desc')}</p>
          <p className="home-dashboard-tip">
            <Sparkles size={14} aria-hidden="true" />
            {t(tipKey, { defaultValue: t('dashboard_ia_tip_curious') })}
          </p>
          <span className="home-dashboard-cta">{t('dashboard_ia_cta')}</span>
        </Link>
      </div>
    </section>
  );
};

export default HomeDashboard;
