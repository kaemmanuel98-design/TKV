import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import ConfessionalPortal from '../components/confessional/ConfessionalPortal';
import ConfessionalChat from '../components/confessional/ConfessionalChat';
import ConfessionalCrisisScreen from '../components/confessional/ConfessionalCrisisScreen';
import ConfessionalPrayer from '../components/confessional/ConfessionalPrayer';
import ConfessionalCompanion from '../components/confessional/ConfessionalCompanion';
import ConfessionalCompanionChat from '../components/confessional/ConfessionalCompanionChat';
import ConfessionalJournal from '../components/confessional/ConfessionalJournal';
import ConfessionalSupport from '../components/confessional/ConfessionalSupport';
import './Confessional.css';

export default function Confessional() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);

  const [view, setView] = useState('portal');
  const [situation, setSituation] = useState('other');
  const [crisisState, setCrisisState] = useState(null);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [companionRequestId, setCompanionRequestId] = useState(null);

  React.useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const lang = i18n.language?.split('-')[0] || 'fr';
  const profileCountry = profile?.country || '';

  const goPortal = () => {
    setView('portal');
    setCrisisState(null);
  };

  const startFromPortal = (nextView, sit) => {
    setSituation(sit || 'other');
    if (sit === 'suicidal') {
      setCrisisState({ level: 'critical', sessionId: null, keywords: [] });
      setView('crisis');
      return;
    }
    setChatSessionId(null);
    setView(nextView);
  };

  const resumeChat = (sessionId, sit) => {
    setSituation(sit || 'other');
    setChatSessionId(sessionId);
    setView('chat');
  };

  const handleCrisis = (payload) => {
    setCrisisState(payload);
    if (payload?.sessionId) setChatSessionId(payload.sessionId);
    setView('crisis');
  };

  return (
    <div className="confessional-page animate-fade-in">
      {view === 'portal' && (
        <ConfessionalPortal
          t={t}
          lang={lang}
          accessToken={session?.access_token}
          onStart={startFromPortal}
          onResumeChat={resumeChat}
          onOpenCompanionChat={(id) => {
            setCompanionRequestId(id);
            setView('companion-chat');
          }}
        />
      )}

      {view !== 'portal' && (
        <div className="confessional-inner container">
          {view === 'chat' && (
            <ConfessionalChat
              t={t}
              situation={situation}
              session={session}
              initialSessionId={chatSessionId}
              accessToken={session?.access_token}
              language={lang}
              userId={user?.id}
              profileCountry={profileCountry}
              onBack={goPortal}
              onCrisis={handleCrisis}
            />
          )}

          {view === 'crisis' && (
            <ConfessionalCrisisScreen
              t={t}
              profileCountry={profileCountry}
              onCompanion={() => setView('companion')}
              onDismiss={() => setView('chat')}
              allowDismiss={crisisState?.level !== 'critical'}
            />
          )}

          {view === 'prayer' && (
            <ConfessionalPrayer t={t} user={user} session={session} onBack={goPortal} />
          )}

          {view === 'companion' && (
            <ConfessionalCompanion
              t={t}
              situation={situation}
              sessionId={chatSessionId || crisisState?.sessionId}
              urgency={crisisState?.level === 'critical' || situation === 'suicidal'}
              accessToken={session?.access_token}
              onBack={goPortal}
              onOpenChat={(id) => {
                setCompanionRequestId(id);
                setView('companion-chat');
              }}
            />
          )}

          {view === 'companion-chat' && companionRequestId && (
            <ConfessionalCompanionChat
              t={t}
              requestId={companionRequestId}
              accessToken={session?.access_token}
              onBack={() => setView('companion')}
            />
          )}

          {view === 'journal' && (
            <ConfessionalJournal t={t} userId={user?.id} onBack={goPortal} />
          )}

          {view === 'support' && (
            <ConfessionalSupport
              t={t}
              language={lang}
              accessToken={session?.access_token}
              onBack={goPortal}
            />
          )}
        </div>
      )}
    </div>
  );
}
