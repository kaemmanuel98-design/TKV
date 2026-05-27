import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Sparkles, Brain, Flame } from 'lucide-react';
import { LogoMark } from '../components/Logo';
import MimshackLogo from '../components/MimshackLogo';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { ONBOARDING_KEY, PROFILE_TYPE_KEY } from '../store/useGamificationStore';
import './Onboarding.css';

const slides = [
  { icon: Sparkles, titleKey: 'onboarding_slide1_title', descKey: 'onboarding_slide1_desc' },
  { mimshack: true, titleKey: 'onboarding_slide2_title', descKey: 'onboarding_slide2_desc' },
  { icon: Flame, titleKey: 'onboarding_slide3_title', descKey: 'onboarding_slide3_desc' },
];

const profileTypes = [
  { id: 'believer', labelKey: 'profile_type_believer' },
  { id: 'skeptic', labelKey: 'profile_type_skeptic' },
  { id: 'curious', labelKey: 'profile_type_curious' },
];

const Onboarding = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProfile } = useProfileStore();
  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState('curious');

  const finish = async () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    localStorage.setItem(PROFILE_TYPE_KEY, userType);
    if (user) {
      await updateProfile(user.id, {
        user_type: userType,
        onboarding_completed: true,
      });
    }
    navigate('/', { replace: true });
  };

  const isProfileStep = step === slides.length;

  return (
    <div className="onboarding animate-fade-in">
      <div className="onboarding-inner">
        <div className="onboarding-logo">
          <LogoMark size={64} />
        </div>

        {!isProfileStep ? (
          <>
            {slides.map(({ icon: Icon, mimshack, titleKey, descKey }, i) => (
              <div
                key={titleKey}
                className={`onboarding-slide ${i === step ? 'onboarding-slide-active' : ''}`}
              >
                <div className="onboarding-slide-icon">
                  {mimshack ? (
                    <MimshackLogo size={40} title="Mimshack" />
                  ) : (
                    <Icon size={32} strokeWidth={1.5} />
                  )}
                </div>
                <h1>{t(titleKey)}</h1>
                <p>{t(descKey)}</p>
              </div>
            ))}
            <div className="onboarding-dots" aria-hidden="true">
              {slides.map((_, i) => (
                <span key={i} className={i === step ? 'active' : ''} />
              ))}
              <span className={isProfileStep ? 'active' : ''} />
            </div>
          </>
        ) : (
          <div className="onboarding-profile-step">
            <h1>{t('onboarding_profile_title')}</h1>
            <p className="onboarding-profile-desc">{t('onboarding_profile_desc')}</p>
            <div className="onboarding-profile-options">
              {profileTypes.map(({ id, labelKey }) => (
                <button
                  key={id}
                  type="button"
                  className={`onboarding-profile-btn ${userType === id ? 'active' : ''}`}
                  onClick={() => setUserType(id)}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          {!isProfileStep && step < slides.length - 1 && (
            <button type="button" className="btn btn-ghost" onClick={finish}>
              {t('onboarding_skip')}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => {
              if (isProfileStep) finish();
              else if (step < slides.length - 1) setStep(step + 1);
              else setStep(slides.length);
            }}
          >
            {isProfileStep ? t('onboarding_start') : t('onboarding_next')}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
