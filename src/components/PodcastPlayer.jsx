import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { formatDuration } from '../data/podcastsCatalog';
import './PodcastPlayer.css';

const PodcastPlayer = ({ src, title, initialPosition = 0, onProgress }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const resumeRef = useRef(Math.max(0, initialPosition || 0));

  useEffect(() => {
    resumeRef.current = Math.max(0, initialPosition || 0);
  }, [initialPosition, src]);

  useEffect(() => {
    setPlaying(false);
    setCurrent(resumeRef.current);
    setDuration(0);
  }, [src]);

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
    if (playing) {
      el.pause();
    } else {
      el.play();
    }
    setPlaying(!playing);
  };

  const seek = (delta) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta));
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="podcast-player card">
      <p className="podcast-player-title">{title}</p>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={() => {
          const t = audioRef.current?.currentTime || 0;
          setCurrent(t);
          onProgress?.(t, audioRef.current?.duration || 0);
        }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration || 0);
          applyResume();
        }}
        onEnded={() => {
          setPlaying(false);
          onProgress?.(audioRef.current?.duration || 0, audioRef.current?.duration || 0, true);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <div className="podcast-player-progress">
        <div className="podcast-player-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="podcast-player-times">
        <span>{formatDuration(Math.floor(current))}</span>
        <span>{formatDuration(Math.floor(duration))}</span>
      </div>
      <div className="podcast-player-controls">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => seek(-15)} aria-label="-15s">
          <SkipBack size={20} />
        </button>
        <button type="button" className="btn btn-primary podcast-play-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => seek(30)} aria-label="+30s">
          <SkipForward size={20} />
        </button>
      </div>
    </div>
  );
};

export default PodcastPlayer;
