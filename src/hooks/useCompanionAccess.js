import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { fetchCompanionMe } from '../lib/companionApi';

/** True si l'utilisateur peut ouvrir /companion (profil ou COMPANION_HOST_EMAILS). */
export function useCompanionAccess() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const profile = useProfileStore((s) => s.profile);
  const [isCompanion, setIsCompanion] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !session?.access_token) {
      setIsCompanion(false);
      return undefined;
    }

    if (profile?.is_confessional_companion === true) {
      setIsCompanion(true);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        await fetchCompanionMe(session.access_token);
        if (!cancelled) setIsCompanion(true);
      } catch {
        if (!cancelled) setIsCompanion(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, session?.access_token, profile?.is_confessional_companion]);

  return { isCompanion, loading };
}
