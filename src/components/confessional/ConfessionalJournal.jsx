import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Trash2 } from 'lucide-react';
import { loadJournalEntries, saveJournalEntry, deleteJournalEntry } from '../../lib/confessionalJournal';

export default function ConfessionalJournal({ t, userId, onBack }) {
  const [entries, setEntries] = useState(() => loadJournalEntries(userId));
  const [draft, setDraft] = useState('');

  const save = () => {
    const entry = saveJournalEntry(userId, draft);
    if (entry) {
      setEntries(loadJournalEntries(userId));
      setDraft('');
    }
  };

  const remove = (id) => {
    deleteJournalEntry(userId, id);
    setEntries(loadJournalEntries(userId));
  };

  return (
    <section className="confessional-journal card">
      <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
        <ArrowLeft size={16} /> {t('confessional_back_portal')}
      </button>
      <h2>{t('confessional_journal_title')}</h2>

      <textarea
        className="input confessional-journal-input"
        rows={5}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={t('confessional_journal_placeholder')}
      />
      <button type="button" className="btn btn-primary" onClick={save} disabled={!draft.trim()}>
        <BookOpen size={16} /> {t('confessional_journal_save')}
      </button>

      {entries.length > 0 && (
        <ul className="confessional-journal-list">
          {entries.map((e) => (
            <li key={e.id}>
              <time>{new Date(e.created_at).toLocaleString()}</time>
              <p>{e.text}</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(e.id)} aria-label={t('confessional_delete')}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
