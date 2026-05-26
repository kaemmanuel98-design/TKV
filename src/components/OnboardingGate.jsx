import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ONBOARDING_KEY } from '../store/useGamificationStore';

const PUBLIC_PATHS = ['/onboarding', '/auth'];

const OnboardingGate = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const complete = localStorage.getItem(ONBOARDING_KEY) === 'true';

  useEffect(() => {
    if (!complete && !PUBLIC_PATHS.some((p) => location.pathname.startsWith(p))) {
      navigate('/onboarding', { replace: true });
    }
  }, [complete, location.pathname, navigate]);

  return children;
};

export default OnboardingGate;
