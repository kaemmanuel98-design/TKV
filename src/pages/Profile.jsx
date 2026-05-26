import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Award, Target, Shield, LogOut } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PaywallModal from '../components/PaywallModal';
import SpeechSettings from '../components/SpeechSettings';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { PROFILE_TYPE_KEY } from '../store/useGamificationStore';
import './Profile.css';

const badgeDefs = [
  { id: 'first_step', labelKey: 'badge_first_step' },
  { id: 'streak_7', labelKey: 'badge_streak_7' },
  { id: 'reader', labelKey: 'badge_reader' },
  { id: 'community', labelKey: 'badge_community' },
];

const profileTypes = ['believer', 'skeptic', 'curious'];

const Profile = () => {
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { profile, fetchProfile, updateProfile, getPlanType } = useProfileStore();
  const { badges, streakCurrent, readingProgress, iaQuestionsCount } = useGamificationStore();
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [userType, setUserType] = useState('curious');
  const [saved, setSaved] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (user) fetchProfile(user.id);
    else {
      setUserType(localStorage.getItem(PROFILE_TYPE_KEY) || 'curious');
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setCountry(profile.country || '');
      setBio(profile.bio || '');
      setUserType(profile.user_type || 'curious');
    }
  }, [profile]);

  const plan = getPlanType();
  const planLabel =
    plan === 'premium_plus'
      ? t('profile_plan_premium_plus')
      : plan === 'premium'
        ? t('profile_plan_premium')
        : t('profile_plan_free');

  const handleSave = async () => {
    localStorage.setItem(PROFILE_TYPE_KEY, userType);
    if (user) {
      await updateProfile(user.id, { country, bio, user_type: userType });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const displayName = user?.user_metadata?.name || profile?.name || t('profile_guest');

  return (
    <div className="container profile-page animate-fade-in">
      <PageHeader title={t('profile_title')} subtitle={displayName} />

      <section className="card profile-plan-card">
        <div>
          <h2 className="profile-section-title">{planLabel}</h2>
          <p className="text-muted">
            {plan === 'free' ? t('profile_plan_desc_free') : t('profile_plan_desc_premium')}
          </p>
        </div>
        {plan === 'free' && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPaywallOpen(true)}>
            {t('agent_upgrade')}
          </button>
        )}
      </section>

      <SpeechSettings />

      <section className="card profile-form">
        <h2 className="profile-section-title">{t('profile_edit_type')}</h2>
        <div className="profile-type-row">
          {profileTypes.map((type) => (
            <button
              key={type}
              type="button"
              className={`profile-type-btn ${userType === type ? 'active' : ''}`}
              onClick={() => setUserType(type)}
            >
              {t(`profile_type_${type}`)}
            </button>
          ))}
        </div>
        <label className="profile-label" htmlFor="profile-country">
          {t('profile_country')}
        </label>
        <input
          id="profile-country"
          className="input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <label className="profile-label" htmlFor="profile-bio">
          {t('profile_bio')}
        </label>
        <textarea
          id="profile-bio"
          className="input"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={t('profile_bio_placeholder')}
        />
        <button type="button" className="btn btn-primary" onClick={handleSave}>
          {saved ? t('profile_saved') : t('profile_save')}
        </button>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">
          <Award size={20} />
          {t('profile_badges_title')}
        </h2>
        <div className="profile-badges">
          {badgeDefs.map(({ id, labelKey }) => (
            <div
              key={id}
              className={`profile-badge ${badges.includes(id) ? 'earned' : 'locked'}`}
            >
              {t(labelKey)}
            </div>
          ))}
        </div>
      </section>

      <section className="profile-section">
        <h2 className="profile-section-title">
          <Target size={20} />
          {t('profile_goals_title')}
        </h2>
        <ul className="profile-goals">
          <li>
            <span>{t('profile_goal_reading')}</span>
            <div className="profile-progress-bar">
              <div className="profile-progress-fill" style={{ width: `${readingProgress}%` }} />
            </div>
          </li>
          <li>
            <span>{t('profile_goal_ia')}</span>
            <strong>{iaQuestionsCount}</strong>
          </li>
          <li>
            <span>{t('profile_goal_community')}</span>
            <strong>{streakCurrent > 0 ? '✓' : '—'}</strong>
          </li>
        </ul>
      </section>

      <section className="card profile-rgpd">
        <h2 className="profile-section-title">
          <Shield size={20} />
          {t('profile_rgpd')}
        </h2>
        <p className="text-muted">{t('profile_rgpd_desc')}</p>
      </section>

      <div className="profile-actions-bottom">
        {user ? (
          <button type="button" className="btn btn-outline" onClick={signOut}>
            <LogOut size={18} />
            {t('profile_logout')}
          </button>
        ) : (
          <Link to="/auth" className="btn btn-primary btn-lg">
            {t('profile_login_cta')}
          </Link>
        )}
      </div>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Profile;
