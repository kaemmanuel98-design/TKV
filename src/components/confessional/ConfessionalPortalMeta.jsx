import React, { useEffect, useState } from 'react';
import { getConfessionalVerse } from '../../data/confessionalVerses';
import {
  fetchOpenConfessionalSessions,
  fetchUserCompanionRequests,
} from '../../lib/confessionalApi';

export default function ConfessionalPortalMeta({
  t,
  lang,
  situation,
  accessToken,
  onResumeChat,
  onOpenCompanionChat,
}) {
  const [sessions, setSessions] = useState([]);
  const [requests, setRequests] = useState([]);
  const verse = getConfessionalVerse(situation, lang);

  useEffect(() => {
    if (!accessToken) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [sRes, rRes] = await Promise.all([
          fetchOpenConfessionalSessions(accessToken),
          fetchUserCompanionRequests(accessToken),
        ]);
        if (!cancelled) {
          setSessions(sRes.sessions || []);
          setRequests(rRes.requests || []);
        }
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const activeRequests = requests.filter((r) =>
    ['pending', 'assigned', 'in_progress'].includes(r.status)
  );

  const hasQuick = sessions.length > 0 || activeRequests.length > 0;

  if (!verse && !hasQuick) return null;

  return (
    <div className="confessional-quick">
      {verse && (
        <blockquote className="confessional-verse">
          <p>{verse.text}</p>
          <cite>{verse.ref}</cite>
        </blockquote>
      )}

      {hasQuick && (
        <div className="confessional-quick-row">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              className="confessional-quick-chip"
              onClick={() => onResumeChat(s.id, s.situation || 'other')}
            >
              {t('confessional_resume_chip', {
                label: t(`confessional_situation_${s.situation || 'other'}`),
              })}
            </button>
          ))}
          {activeRequests.map((r) => (
            <button
              key={r.id}
              type="button"
              className="confessional-quick-chip"
              disabled={!['assigned', 'in_progress'].includes(r.status)}
              onClick={() => onOpenCompanionChat(r.id)}
            >
              {t(`confessional_request_status_${r.status}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
