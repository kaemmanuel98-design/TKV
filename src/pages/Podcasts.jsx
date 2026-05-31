import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Headphones, Lock, PlayCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PodcastPlayer from '../components/PodcastPlayer';
import PaywallModal from '../components/PaywallModal';
import { supabase } from '../lib/supabase';
import { PODCAST_CATALOG, formatDuration } from '../data/podcastsCatalog';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../store/useAuthStore';
import {
  fetchPodcastProgressForEpisodes,
  getLocalPodcastProgress,
  savePodcastProgress,
} from '../lib/podcastProgressSync';
import { usePodcastQuotaStore } from '../store/usePodcastQuotaStore';
import './Podcasts.css';

function mapCatalogItem(item, t) {
  return {
    slug: item.slug,
    title: item.titleKey ? t(item.titleKey) : item.title,
    description: item.descKey ? t(item.descKey) : item.description,
    audio_url: item.audio_url,
    duration_seconds: item.duration_seconds,
    is_premium: item.is_premium,
    episode_number: item.episode_number,
  };
}

const Podcasts = () => {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isPremium = useProfileStore((s) => s.isPremium);
  const canPlay = usePodcastQuotaStore((s) => s.canPlay);
  const recordPlay = usePodcastQuotaStore((s) => s.recordPlay);
  const remainingFree = usePodcastQuotaStore((s) => s.remainingFree);
  const [episodes, setEpisodes] = useState(() => PODCAST_CATALOG.map((p) => mapCatalogItem(p, t)));
  const [active, setActive] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [progressBySlug, setProgressBySlug] = useState({});
  const saveTimerRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .order('episode_number', { ascending: true });

      if (!error && data?.length) {
        setEpisodes(data);
        setActive(data[0]);
      } else {
        const mapped = PODCAST_CATALOG.map((p) => mapCatalogItem(p, t));
        setEpisodes(mapped);
        setActive(mapped[0]);
      }
    })();
  }, [t, i18n.language]);

  useEffect(() => {
    if (!episodes.length) return;
    let cancelled = false;
    (async () => {
      const map = await fetchPodcastProgressForEpisodes(user?.id, episodes);
      if (!cancelled) setProgressBySlug(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [episodes, user?.id]);

  const playEpisode = (ep) => {
    if (ep.is_premium && !isPremium()) {
      setPaywallOpen(true);
      return;
    }
    if (!canPlay(ep.slug, isPremium())) {
      setPaywallOpen(true);
      return;
    }
    recordPlay(ep.slug);
    setActive(ep);
  };

  const handleProgress = useCallback(
    (positionSeconds, durationSeconds, completed = false) => {
      if (!active?.slug) return;
      const slug = active.slug;
      const nearEnd = durationSeconds > 0 && positionSeconds >= durationSeconds * 0.92;
      const done = completed || nearEnd;

      setProgressBySlug((prev) => ({
        ...prev,
        [slug]: {
          position_seconds: Math.floor(positionSeconds),
          completed: done || prev[slug]?.completed,
          updated_at: new Date().toISOString(),
        },
      }));

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        savePodcastProgress(user?.id, active, {
          position_seconds: positionSeconds,
          completed: done,
        });
      }, 2000);
    },
    [active, user?.id]
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const activeProgress = active?.slug
    ? progressBySlug[active.slug] || getLocalPodcastProgress(active.slug)
    : null;

  const freeCount = episodes.filter((e) => !e.is_premium).length;

  return (
    <div className="container podcasts-page animate-fade-in">
      <PageHeader
        eyebrow={t('podcast_eyebrow')}
        title={t('podcast_page_title')}
        subtitle={t('podcast_page_subtitle', { free: freeCount })}
        showLogo
      />

      {active?.audio_url && (
        <PodcastPlayer
          key={active.slug}
          src={active.audio_url}
          title={active.title}
          initialPosition={activeProgress?.completed ? 0 : activeProgress?.position_seconds || 0}
          onProgress={handleProgress}
        />
      )}

      <div className="podcasts-list">
        {episodes.map((ep) => {
          const locked = ep.is_premium && !isPremium();
          const isActive = active?.slug === ep.slug;
          const prog = progressBySlug[ep.slug];
          return (
            <button
              key={ep.slug}
              type="button"
              className={`card podcasts-item ${isActive ? 'podcasts-item-active' : ''} ${locked ? 'podcasts-item-locked' : ''}`}
              onClick={() => playEpisode(ep)}
            >
              <div className="podcasts-item-icon">
                {locked ? <Lock size={20} /> : <Headphones size={20} strokeWidth={1.5} />}
              </div>
              <div className="podcasts-item-body">
                <span className="podcasts-ep-num">
                  {t('podcast_episode_label', { num: ep.episode_number })}
                  {prog?.completed ? ` · ${t('course_module_complete')}` : ''}
                </span>
                <h3>{ep.title}</h3>
                <p>{ep.description}</p>
                <span className="podcasts-duration">
                  {formatDuration(ep.duration_seconds || 0)}
                  {ep.is_premium ? ` · ${t('course_premium_only')}` : ` · ${t('course_free_badge')}`}
                </span>
              </div>
              <PlayCircle size={22} className="podcasts-play-icon" />
            </button>
          );
        })}
      </div>

      <p className="podcasts-quota text-muted">
        {t('podcast_quota_note')}
        {!isPremium() && (
          <>
            {' '}
            {remainingFree() > 0
              ? t('podcast_quota_remaining', { count: remainingFree() })
              : t('podcast_quota_blocked')}
          </>
        )}
      </p>

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Podcasts;
