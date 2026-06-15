import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, Highlighter, Loader2 } from 'lucide-react';
import { getBookName } from '../../data/bible/catalog';
import { loadBibleChapter } from '../../data/bible/loadChapter';
import { resolveBibleReadLang, pickBibleChapterLang } from '../../data/bible/languages';
import { getVerseHighlightColor, HIGHLIGHT_COLORS } from '../../data/bible/highlightColors';
import { getHighlightColorLabel, loadHighlightLabels, saveHighlightLabels } from '../../lib/bible/highlightLabels';
import { verseText } from '../../data/bible/utils';
import { useBibleStore } from '../../store/useBibleStore';
import HighlightColorPicker from './HighlightColorPicker';

const LOCAL_VERSE_NOTES_KEY = 'tkv_bible_verse_notes_local';

function loadLocalVerseNotes() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_VERSE_NOTES_KEY) || '{}');
  } catch {
    return {};
  }
}

function sortHighlights(rows) {
  return [...rows].sort((a, b) => {
    const bookCmp = String(a.book_id).localeCompare(String(b.book_id));
    if (bookCmp !== 0) return bookCmp;
    if (Number(a.chapter_num) !== Number(b.chapter_num)) {
      return Number(a.chapter_num) - Number(b.chapter_num);
    }
    return Number(a.verse_num) - Number(b.verse_num);
  });
}

export default function HighlightedVersesPanel({ userId, verseNotesTableMissing, supabase, refreshKey = 0, onLabelsChange }) {
  const { t, i18n } = useTranslation();
  const lang = resolveBibleReadLang(i18n.language);
  const frenchVersion = useBibleStore((s) => s.frenchVersion);
  const setBook = useBibleStore((s) => s.setBook);
  const setChapter = useBibleStore((s) => s.setChapter);
  const setScrollToVerse = useBibleStore((s) => s.setScrollToVerse);

  const [open, setOpen] = useState(false);
  const [manageColors, setManageColors] = useState(false);
  const [filterColor, setFilterColor] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snippets, setSnippets] = useState({});
  const [customLabels, setCustomLabels] = useState(() => loadHighlightLabels(userId));
  const [labelDrafts, setLabelDrafts] = useState(() => loadHighlightLabels(userId));
  const chapterCache = useRef({});

  const mineId = userId || 'guest';

  const loadHighlights = useCallback(async () => {
    setLoading(true);
    try {
      const localRows = Object.values(loadLocalVerseNotes()).filter(
        (row) => row?.user_id === mineId && getVerseHighlightColor(row)
      );

      if (!userId || verseNotesTableMissing) {
        setRows(sortHighlights(localRows));
        return;
      }

      const { data, error } = await supabase
        .from('bible_verse_notes')
        .select(
          'id, user_id, book_id, chapter_num, verse_num, verse_ref, highlighted, highlight_color, note, visibility, updated_at'
        )
        .eq('user_id', userId)
        .or('highlighted.eq.true,highlight_color.not.is.null')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const remote = (data || []).filter((row) => getVerseHighlightColor(row));
      const byRef = new Map();
      for (const row of remote) byRef.set(row.verse_ref, row);
      for (const row of localRows) {
        if (!byRef.has(row.verse_ref)) byRef.set(row.verse_ref, row);
      }
      setRows(sortHighlights([...byRef.values()]));
    } catch (err) {
      console.error(err);
      const fallback = Object.values(loadLocalVerseNotes()).filter(
        (row) => row?.user_id === mineId && getVerseHighlightColor(row)
      );
      setRows(sortHighlights(fallback));
    } finally {
      setLoading(false);
    }
  }, [mineId, supabase, userId, verseNotesTableMissing]);

  useEffect(() => {
    loadHighlights();
  }, [loadHighlights, refreshKey]);

  useEffect(() => {
    if (!open) return;
    const labels = loadHighlightLabels(userId);
    setCustomLabels(labels);
    setLabelDrafts(labels);
  }, [userId]);

  const filteredRows = useMemo(() => {
    if (filterColor === 'all') return rows;
    return rows.filter((row) => getVerseHighlightColor(row) === filterColor);
  }, [filterColor, rows]);

  useEffect(() => {
    if (!open || !filteredRows.length) return;
    let cancelled = false;

    const loadSnippets = async () => {
      const next = {};
      for (const row of filteredRows) {
        const key = `${row.book_id}:${row.chapter_num}`;
        if (!chapterCache.current[key]) {
          chapterCache.current[key] = await loadBibleChapter(row.book_id, row.chapter_num);
        }
        const chapter = chapterCache.current[key];
        if (!chapter) continue;
        const localized = pickBibleChapterLang(chapter, lang, frenchVersion);
        const verse = localized?.verses?.find((v) => Number(v.id) === Number(row.verse_num));
        if (verse) {
          next[row.verse_ref] = verseText(verse).slice(0, 160);
        }
      }
      if (!cancelled) setSnippets((prev) => ({ ...prev, ...next }));
    };

    loadSnippets();
    return () => {
      cancelled = true;
    };
  }, [filteredRows, frenchVersion, lang, open]);

  const countsByColor = useMemo(() => {
    const counts = { all: rows.length };
    for (const color of HIGHLIGHT_COLORS) counts[color.id] = 0;
    for (const row of rows) {
      const c = getVerseHighlightColor(row);
      if (c) counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [rows]);

  const goToVerse = (row) => {
    setBook(row.book_id);
    setChapter(Number(row.chapter_num));
    setScrollToVerse(Number(row.verse_num));
    setOpen(false);
  };

  const saveLabels = () => {
    const saved = saveHighlightLabels(userId, labelDrafts);
    setCustomLabels(saved);
    onLabelsChange?.(saved);
    setManageColors(false);
  };

  return (
    <div className="card bible-highlights-panel">
      <button
        type="button"
        className="bible-highlights-panel-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="bible-highlights-panel-title">
          <Highlighter size={18} />
          {t('bible_highlight_my_verses', { defaultValue: 'Mes versets surlignés' })}
          {rows.length > 0 ? <span className="bible-highlights-count">{rows.length}</span> : null}
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open ? (
        <div className="bible-highlights-panel-body">
          <div className="bible-highlights-toolbar">
            <div
              className="bible-highlights-filters"
              role="tablist"
              aria-label={t('bible_highlight_filter_by_color', { defaultValue: 'Filtrer par couleur' })}
            >
              <button
                type="button"
                role="tab"
                aria-selected={filterColor === 'all'}
                className={`bible-highlight-filter ${filterColor === 'all' ? 'is-active' : ''}`}
                onClick={() => setFilterColor('all')}
              >
                {t('bible_highlight_filter_all', { defaultValue: 'Toutes' })}
                <span className="bible-highlight-filter-count">{countsByColor.all}</span>
              </button>
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  role="tab"
                  aria-selected={filterColor === color.id}
                  className={`bible-highlight-filter ${filterColor === color.id ? 'is-active' : ''}`}
                  onClick={() => setFilterColor(color.id)}
                  title={getHighlightColorLabel(color.id, t, customLabels)}
                >
                  <span className="bible-highlight-filter-dot" style={{ background: color.swatch }} />
                  <span className="bible-highlight-filter-label">
                    {getHighlightColorLabel(color.id, t, customLabels)}
                  </span>
                  <span className="bible-highlight-filter-count">{countsByColor[color.id] || 0}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setManageColors((v) => !v)}
            >
              {t('bible_highlight_manage_colors', { defaultValue: 'Titres des couleurs' })}
            </button>
          </div>

          {manageColors ? (
            <div className="bible-highlight-labels-editor">
              <p className="text-muted bible-highlight-labels-desc">
                {t('bible_highlight_colors_desc', {
                  defaultValue: 'Attribue un titre à chaque couleur (optionnel).',
                })}
              </p>
              {HIGHLIGHT_COLORS.map((color) => (
                <label key={color.id} className="bible-highlight-label-row">
                  <span className="bible-highlight-label-swatch" style={{ background: color.swatch }} />
                  <span className="bible-highlight-label-default">
                    {t(color.labelKey, { defaultValue: color.id })}
                  </span>
                  <input
                    className="input"
                    type="text"
                    maxLength={48}
                    value={labelDrafts[color.id] || ''}
                    placeholder={t('bible_highlight_color_label_placeholder', {
                      defaultValue: 'Titre personnalisé (optionnel)',
                    })}
                    onChange={(e) =>
                      setLabelDrafts((prev) => ({ ...prev, [color.id]: e.target.value }))
                    }
                  />
                </label>
              ))}
              <div className="bible-highlight-labels-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setManageColors(false)}>
                  {t('cancel')}
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={saveLabels}>
                  {t('bible_highlight_save_labels', { defaultValue: 'Enregistrer les titres' })}
                </button>
              </div>
            </div>
          ) : null}

          {loading ? (
            <p className="bible-highlights-loading text-muted">
              <Loader2 size={16} className="spin" />
              {t('bible_highlights_loading', { defaultValue: 'Chargement…' })}
            </p>
          ) : filteredRows.length === 0 ? (
            <p className="text-muted bible-highlights-empty">
              {t('bible_highlight_empty', { defaultValue: 'Aucun verset surligné pour cette couleur.' })}
            </p>
          ) : (
            <ul className="bible-highlights-list">
              {filteredRows.map((row) => {
                const color = getVerseHighlightColor(row);
                const meta = HIGHLIGHT_COLORS.find((c) => c.id === color);
                return (
                  <li key={row.verse_ref || row.id}>
                    <button type="button" className="bible-highlights-item" onClick={() => goToVerse(row)}>
                      <span className="bible-highlights-item-ref">
                        <span
                          className="bible-highlights-item-dot"
                          style={{ background: meta?.swatch || 'var(--gold)' }}
                          title={getHighlightColorLabel(color, t, customLabels)}
                        />
                        {getBookName(row.book_id, lang)} {row.chapter_num}:{row.verse_num}
                      </span>
                      {snippets[row.verse_ref] ? (
                        <span className="bible-highlights-item-snippet">{snippets[row.verse_ref]}</span>
                      ) : null}
                      <span className="bible-highlights-item-cta">
                        {t('bible_highlight_open_verse', { defaultValue: 'Aller au verset' })}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
