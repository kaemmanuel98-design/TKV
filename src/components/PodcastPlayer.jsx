import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '../data/podcastsCatalog';
import './PodcastPlayer.css';

const SPEEDS = [1, 1.25, 1.5];
const LONG_FORM_SEC = 20 * 60;

const PodcastPlayer = forwardRef(function PodcastPlayer(
  { src, fallbackSrc, title, initialPosition = 0, onProgress, onAudioFallback, longForm = false },
  ref
) {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);
  const resumeRef = useRef(Math.max(0, initialPosition || 0));
  const lastProgressReportRef = useRef(0);
  const [activeSrc, setActiveSrc] = useState(src);
  const fallbackUsedRef = useRef(false);

  useEffect(() => {
    fallbackUsedRef.current = false;
    setActiveSrc(src);
  }, [src]);

  const skipSeconds = longForm || duration >= LONG_FORM_SEC ? 30 : 15;

  useEffect(() => {
    resumeRef.current = Math.max(0, initialPosition || 0);
  }, [initialPosition, activeSrc]);

  useEffect(() => {
    setPlaying(false);
    setCurrent(resumeRef.current);
    setDuration(0);
    setSpeedIdx(0);
  }, [activeSrc]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx, activeSrc]);

  const applyResume = () => {
    const el = audioRef.current;
    if (!el || !resumeRef.current) return;
    const max = el.duration && Number.isFinite(el.duration) ? el.duration - 1 : resumeRef.current;
    const target = Math.min(resumeRef.current, Math.max(0, max));
    if (target > 1) {
      el.currentTime = target;
      setCurrent(target);
    }
    resumeRef.current = 0;
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) el.pause();
    else el.play();
    setPlaying(!playing);
  };

  const seek = (delta) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  };

  const seekToRatio = useCallback(
    (clientX) => {
      const bar = progressRef.current;
      const el = audioRef.current;
      if (!bar || !el || !el.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      el.currentTime = ratio * el.duration;
      setCurrent(el.currentTime);
    },
    []
  );

  const cycleSpeed = () => {
    setSpeedIdx((i) => (i + 1) % SPEEDS.length);
  };

  const seekTo = useCallback((seconds) => {
    const el = audioRef.current;
    if (!el || !Number.isFinite(seconds)) return;
    el.currentTime = Math.max(0, Math.min(el.duration || seconds, seconds));
    setCurrent(el.currentTime);
  }, []);

  useImperativeHandle(ref, () => ({ seekTo }), [seekTo]);

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="podcast-player card">
      <p className="podcast-player-title">{title}</p>
      <audio
        ref={audioRef}
        src={activeSrc}
        preload="metadata"
        onError={() => {
          if (fallbackSrc && activeSrc !== fallbackSrc && !fallbackUsedRef.current) {
            fallbackUsedRef.current = true;
            setActiveSrc(fallbackSrc);
            onAudioFallback?.();
          }
        }}
        onTimeUpdate={() => {
          const tSec = audioRef.current?.currentTime || 0;
          setCurrent(tSec);
          const now = Date.now();
          if (now - lastProgressReportRef.current >= 1000) {
            lastProgressReportRef.current = now;
            onProgress?.(tSec, audioRef.current?.duration || 0);
          }
        }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0);
          applyResume();
        }}
        onEnded={() => {
          setPlaying(false);
          lastProgressReportRef.current = Date.now();
          onProgress?.(audioRef.current?.duration || 0, audioRef.current?.duration || 0, true);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div
        ref={progressRef}
        className="podcast-player-progress"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={current}
        aria-label={title}
        tabIndex={0}
        onClick={(e) => seekToRatio(e.clientX)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(skipSeconds);
          if (e.key === 'ArrowLeft') seek(-skipSeconds);
        }}
      >
        <div className="podcast-player-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="podcast-player-times">
        <span>{formatDuration(Math.floor(current))}</span>
        <span>{formatDuration(Math.floor(duration))}</span>
      </div>
      <div className="podcast-player-controls">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => seek(-skipSeconds)}
          aria-label={`-${skipSeconds}s`}
        >
          <SkipBack size={20} />
        </button>
        <button
          type="button"
          className="btn btn-primary podcast-play-btn"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => seek(skipSeconds)}
          aria-label={`+${skipSeconds}s`}
        >
          <SkipForward size={20} />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm podcast-speed-btn"
          onClick={cycleSpeed}
          aria-label={t('podcast_speed_label')}
          title={t('podcast_speed_label')}
        >
          {SPEEDS[speedIdx].toFixed(SPEEDS[speedIdx] % 1 ? 2 : 0)}×
        </button>
      </div>
    </div>
  );
});

export default PodcastPlayer;
