import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDuration } from '../data/podcastsCatalog';
import { translateParagraphs } from '../lib/translateOnDemand';
import { podcastLangCode } from '../lib/podcastMedia';
import './PodcastTranscript.css';

function pickTranslationPack(raw, targetLang) {
  const to = targetLang?.split('-')[0] || 'fr';
  const pack = raw?.translations?.[to];
  if (!pack?.paragraphs?.length) return null;
  return pack;
}

const PodcastTranscript = ({
  transcriptUrl,
  currentTime = 0,
  onSeek,
  sourceLang = 'fr',
  audioLang,
}) => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [raw, setRaw] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
  const [summary, setSummary] = useState('');
  const [chapters, setChapters] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const paraRefs = useRef([]);
  const lastActiveIdxRef = useRef(-1);
  const lastScrollIdxRef = useRef(-1);

  const targetLang = i18n.language?.split('-')[0] || 'fr';
  const src = sourceLang?.split('-')[0] || 'fr';

  useEffect(() => {
    if (!transcriptUrl) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch(transcriptUrl);
        if (!res.ok) throw new Error('transcript_load_failed');
        const data = await res.json();
        if (cancelled) return;
        setRaw(data);
      } catch {
        if (!cancelled) {
          setRaw(null);
          setParagraphs([]);
          setSummary('');
          setChapters([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [transcriptUrl]);

  useEffect(() => {
    if (!raw?.paragraphs?.length) return;

    if (targetLang === src) {
      setParagraphs(raw.paragraphs);
      setSummary(raw.summary || '');
      setChapters(raw.chapters || []);
      return;
    }

    const baked = pickTranslationPack(raw, targetLang);
    if (baked) {
      setParagraphs(baked.paragraphs);
      setSummary(baked.summary || raw.summary || '');
      setChapters(baked.chapters || raw.chapters || []);
      return;
    }

    let cancelled = false;
    setTranslating(true);
    (async () => {
      try {
        const texts = raw.paragraphs.map((p) => p.text);
        const translated = await translateParagraphs(texts, targetLang, src);
        if (cancelled) return;
        setParagraphs(
          raw.paragraphs.map((p, i) => ({
            ...p,
            text: translated[i]?.trim() ? translated[i] : p.text,
          }))
        );
        if (raw.summary) {
          const [sumTr] = await translateParagraphs([raw.summary], targetLang, src);
          setSummary(sumTr?.trim() ? sumTr : raw.summary);
        } else {
          setSummary('');
        }
        if (raw.chapters?.length) {
          const chapTitles = raw.chapters.map((c) => c.title);
          const chapTr = await translateParagraphs(chapTitles, targetLang, src);
          setChapters(
            raw.chapters.map((c, i) => ({
              ...c,
              title: chapTr[i]?.trim() ? chapTr[i] : c.title,
            }))
          );
        } else {
          setChapters([]);
        }
      } catch {
        if (!cancelled) {
          setParagraphs(raw.paragraphs);
          setSummary(raw.summary || '');
          setChapters(raw.chapters || []);
        }
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [raw, targetLang, src]);

  useEffect(() => {
    if (!paragraphs.length) {
      lastActiveIdxRef.current = -1;
      setActiveIdx(-1);
      return;
    }
    let idx = -1;
    for (let i = 0; i < paragraphs.length; i += 1) {
      if (currentTime >= paragraphs[i].start) idx = i;
      else break;
    }
    if (idx !== lastActiveIdxRef.current) {
      lastActiveIdxRef.current = idx;
      setActiveIdx(idx);
    }
  }, [currentTime, paragraphs]);

  useEffect(() => {
    if (activeIdx < 0 || !open || activeIdx === lastScrollIdxRef.current) return;
    const timer = window.setTimeout(() => {
      lastScrollIdxRef.current = activeIdx;
      paraRefs.current[activeIdx]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 450);
    return () => clearTimeout(timer);
  }, [activeIdx, open]);

  const showLangNote = targetLang !== src;
  const syncedAudioLang = podcastLangCode(audioLang || src);
  const usingLiveTranslate = showLangNote && !pickTranslationPack(raw, targetLang);
  const showMediaLangNote = syncedAudioLang === targetLang && !usingLiveTranslate;

  if (!transcriptUrl) return null;

  return (
    <section className="podcast-transcript card">
      <button
        type="button"
        className="podcast-transcript-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <FileText size={18} />
        <span>{t('podcast_transcript_title')}</span>
        {(loading || translating) && <Loader2 size={16} className="podcast-transcript-spin" />}
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && showMediaLangNote && (
        <p className="podcast-transcript-lang-note text-muted">{t('podcast_media_lang_note')}</p>
      )}

      {open && showLangNote && !showMediaLangNote && (
        <p className="podcast-transcript-lang-note text-muted">
          {t('podcast_transcript_lang_note')}
        </p>
      )}

      {summary && open && <p className="podcast-transcript-summary">{summary}</p>}

      {open && chapters.length > 1 && (
        <div className="podcast-transcript-chapters">
          {chapters.map((ch, i) => {
            const nextStart = chapters[i + 1]?.start ?? Infinity;
            const isActive = currentTime >= ch.start && currentTime < nextStart;
            return (
              <button
                key={ch.start}
                type="button"
                className={`podcast-transcript-chapter ${isActive ? 'is-active' : ''}`}
                onClick={() => onSeek?.(ch.start)}
                title={ch.title}
              >
                {formatDuration(Math.floor(ch.start))}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div className="podcast-transcript-body">
          {loading && <p className="text-muted">{t('podcast_transcript_loading')}</p>}
          {!loading && !paragraphs.length && (
            <p className="text-muted">{t('podcast_transcript_unavailable')}</p>
          )}
          {!loading &&
            paragraphs.map((p, i) => (
              <button
                key={`${p.start}-${i}`}
                type="button"
                ref={(el) => {
                  paraRefs.current[i] = el;
                }}
                className={`podcast-transcript-para ${i === activeIdx ? 'is-active' : ''}`}
                onClick={() => onSeek?.(p.start)}
              >
                <span className="podcast-transcript-time">{formatDuration(Math.floor(p.start))}</span>
                <span className="podcast-transcript-text">{p.text}</span>
              </button>
            ))}
          {usingLiveTranslate && !translating && (
            <p className="podcast-transcript-fallback text-muted">{t('podcast_transcript_live_translate')}</p>
          )}
        </div>
      )}
    </section>
  );
};

export default PodcastTranscript;
