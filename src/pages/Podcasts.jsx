import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Headphones, Lock, PlayCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PodcastPlayer from '../components/PodcastPlayer';
import PodcastTranscript from '../components/PodcastTranscript';
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
import { loadPodcastManifest, resolvePodcastMedia, podcastLangCode } from '../lib/podcastMedia';
import './Podcasts.css';

function mapCatalogItem(item, t) {
  const catalog = PODCAST_CATALOG.find((c) => c.slug === item.slug);
  const titleKey = item.titleKey || catalog?.titleKey;
  const descKey = item.descKey || catalog?.descKey;
  return {
    slug: item.slug,
    title: titleKey ? t(titleKey) : item.title,
    description: descKey ? t(descKey) : item.description,
    audio_url: item.audio_url || catalog?.audio_url,
    transcript_url: item.transcript_url || catalog?.transcript_url || null,
    duration_seconds: item.duration_seconds ?? catalog?.duration_seconds,
    is_premium: item.is_premium ?? catalog?.is_premium ?? false,
    episode_number: item.episode_number ?? catalog?.episode_number,
    content_type: item.content_type || catalog?.content_type || null,
    language: item.language || catalog?.language || 'fr',
    titleKey,
    descKey,
  };
}

const PodcastEpisodeItem = memo(function PodcastEpisodeItem({
  ep,
  isActive,
  locked,
  prog,
  onPlay,
  t,
}) {
  return (
    <button
      type="button"
      className={`card podcasts-item ${isActive ? 'podcasts-item-active' : ''} ${locked ? 'podcasts-item-locked' : ''}`}
      onClick={() => onPlay(ep)}
    >
      <div className="podcasts-item-icon">
        {locked ? <Lock size={20} /> : <Headphones size={20} strokeWidth={1.5} />}
      </div>
      <div className="podcasts-item-body">
        <span className="podcasts-ep-num">
          {ep.content_type === 'sermon' && (
            <span className="podcasts-sermon-badge">{t('podcast_sermon_badge')}</span>
          )}
          {ep.content_type === 'podcast' && (
            <span className="podcasts-sermon-badge">{t('podcast_eyebrow')}</span>
          )}
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
});

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
  const [transcriptTime, setTranscriptTime] = useState(0);
  const [manifest, setManifest] = useState({});
  const [audioFallback, setAudioFallback] = useState(false);
  const saveTimerRef = useRef(null);
  const playerRef = useRef(null);
  const progressUiRef = useRef({});

  useEffect(() => {
    loadPodcastManifest().then(setManifest);
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('podcasts')
        .select('*')
        .order('episode_number', { ascending: true });

      if (!error && data?.length) {
        const mappedRemote = data.map((d) => mapCatalogItem(d, t));
        const remoteSlugs = new Set(mappedRemote.map((d) => d.slug));
        const localSermons = PODCAST_CATALOG.filter(
          (p) => (p.content_type === 'sermon' || p.content_type === 'podcast') && !remoteSlugs.has(p.slug)
        ).map((p) => mapCatalogItem(p, t));
        const merged = [...localSermons, ...mappedRemote];
        setEpisodes(merged);
        setActive((prev) => {
          if (!prev) return merged[0];
          return merged.find((e) => e.slug === prev.slug) || merged[0];
        });
      } else {
        const mapped = PODCAST_CATALOG.map((p) => mapCatalogItem(p, t));
        setEpisodes(mapped);
        setActive((prev) => prev || mapped[0] || null);
      }
    })();
  }, [t, i18n.language]);

  useEffect(() => {
    setTranscriptTime(0);
    progressUiRef.current = {};
    setAudioFallback(false);
  }, [active?.slug, i18n.language]);

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

  const playEpisode = useCallback(
    (ep) => {
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
    },
    [canPlay, isPremium, recordPlay]
  );

  const handleProgress = useCallback(
    (positionSeconds, durationSeconds, completed = false) => {
      setTranscriptTime(positionSeconds);
      if (!active?.slug) return;
      const slug = active.slug;
      const nearEnd = durationSeconds > 0 && positionSeconds >= durationSeconds * 0.92;
      const done = completed || nearEnd;
      const floored = Math.floor(positionSeconds);
      const prev = progressUiRef.current[slug];

      if (!prev || prev.position_seconds !== floored || prev.completed !== done) {
        progressUiRef.current[slug] = { position_seconds: floored, completed: done };
        setProgressBySlug((prevMap) => ({
          ...prevMap,
          [slug]: {
            position_seconds: floored,
            completed: done || prevMap[slug]?.completed,
            updated_at: new Date().toISOString(),
          },
        }));
      }

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
  const premium = isPremium();
  const uiLang = podcastLangCode(i18n.language);
  const activeMedia = active ? resolvePodcastMedia(active, uiLang, manifest) : null;
  const showAudioFallback =
    audioFallback || (activeMedia?.usedFallback && uiLang !== activeMedia?.audioLang);

  return (
    <div className="container podcasts-page animate-fade-in">
      <PageHeader
        eyebrow={t('podcast_eyebrow')}
        title={t('podcast_page_title')}
        subtitle={t('podcast_page_subtitle', { free: freeCount })}
        showLogo
      />

      {activeMedia?.audioUrl && (
        <>
          {showAudioFallback && (
            <p className="podcasts-audio-fallback text-muted">{t('podcast_audio_fallback')}</p>
          )}
          <PodcastPlayer
            ref={playerRef}
            key={`${active.slug}-${activeMedia.audioLang}`}
            src={activeMedia.audioUrl}
            fallbackSrc={active.audio_url}
            title={active.title}
            longForm={
              active.content_type === 'sermon' ||
              (activeMedia.durationSeconds || active.duration_seconds || 0) >= 20 * 60
            }
            initialPosition={activeProgress?.completed ? 0 : activeProgress?.position_seconds || 0}
            onProgress={handleProgress}
            onAudioFallback={() => setAudioFallback(true)}
          />
          {activeMedia.transcriptUrl && (
            <PodcastTranscript
              transcriptUrl={activeMedia.transcriptUrl}
              currentTime={transcriptTime}
              sourceLang={activeMedia.transcriptLang}
              audioLang={activeMedia.audioLang}
              onSeek={(sec) => playerRef.current?.seekTo(sec)}
            />
          )}
        </>
      )}

      <div className="podcasts-list">
        {episodes.map((ep) => (
          <PodcastEpisodeItem
            key={ep.slug}
            ep={ep}
            isActive={active?.slug === ep.slug}
            locked={ep.is_premium && !premium}
            prog={progressBySlug[ep.slug]}
            onPlay={playEpisode}
            t={t}
          />
        ))}
      </div>

      <p className="podcasts-quota text-muted">
        {t('podcast_quota_note')}
        {!premium && (
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
