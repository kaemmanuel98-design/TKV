import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Loader2, Plus, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { CellsLogo, CommunityLogo } from '../components/SectionLogos';
import ProfileAvatar from '../components/ProfileAvatar';
import { CELL_ROOMS } from '../data/cellsRooms';
import { fetchCustomCells, createCell } from '../lib/cellsApi';
import { canCreateCellFromProfile } from '../lib/cellHost';
import PaywallModal from '../components/PaywallModal';
import './Cells.css';

async function enrichMessages(rows, t) {
  if (!rows?.length) return [];
  const userIds = [...new Set(rows.map((m) => m.user_id).filter(Boolean))];
  let profileById = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
    profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  return rows.map((msg) => {
    const prof = profileById[msg.user_id];
    return {
      ...msg,
      cell_slug: msg.cell_slug || 'global',
      authorName: prof?.name || t('community_author_anonymous'),
      authorAvatar: prof?.avatar_url || null,
    };
  });
}

const Cells = () => {
  const { t, i18n } = useTranslation();
  const { user, session } = useAuthStore();
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const [customCells, setCustomCells] = useState([]);
  const [showCreateCell, setShowCreateCell] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLanguage, setCreateLanguage] = useState(
    () => i18n.language?.split('-')[0] || 'fr'
  );
  const [createBusy, setCreateBusy] = useState(false);
  const [createNotice, setCreateNotice] = useState(null);
  const [paywallOpen, setPaywallOpen] = useState(false);

  const defaultSlug =
    CELL_ROOMS.find((r) => r.slug === i18n.language?.split('-')[0])?.slug || 'global';
  const [activeSlug, setActiveSlug] = useState(defaultSlug);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const activeOfficialRoom = CELL_ROOMS.find((r) => r.slug === activeSlug);
  const activeCustomRoom = customCells.find((c) => c.slug === activeSlug);
  const activeRoomLabel = activeOfficialRoom
    ? t(activeOfficialRoom.labelKey)
    : activeCustomRoom?.name || activeSlug;

  const allowCreateCell = canCreateCellFromProfile(profile);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const loadCustomCells = useCallback(async () => {
    try {
      const rows = await fetchCustomCells();
      setCustomCells(rows);
    } catch (err) {
      console.error(err);
      setCustomCells([]);
    }
  }, []);

  useEffect(() => {
    loadCustomCells();
  }, [loadCustomCells]);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('id, created_at, content, user_id, cell_slug')
        .order('created_at', { ascending: true })
        .limit(80)
        .eq('cell_slug', activeSlug);

      if (fetchError?.message?.includes('cell_slug')) {
        const fallback = await supabase
          .from('messages')
          .select('id, created_at, content, user_id')
          .order('created_at', { ascending: true })
          .limit(80);
        if (fallback.error) throw fallback.error;
        const globalOnly = (fallback.data || []).map((m) => ({ ...m, cell_slug: 'global' }));
        const filtered =
          activeSlug === 'global' ? globalOnly : globalOnly.filter(() => false);
        setMessages(await enrichMessages(filtered, t));
        return;
      }

      if (fetchError) throw fetchError;
      setMessages(await enrichMessages(data || [], t));
    } catch (err) {
      console.error(err);
      setError(t('cells_load_error'));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [activeSlug, t]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`cell-messages-${activeSlug}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `cell_slug=eq.${activeSlug}`,
        },
        async (payload) => {
          const slug = payload.new.cell_slug || 'global';
          if (slug !== activeSlug) return;
          const enriched = await enrichMessages([payload.new], t);
          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched[0]?.id)) return prev;
            return [...prev, enriched[0]];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSlug, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    if (!user) {
      setError(t('chat_auth_required'));
      return;
    }

    setSending(true);
    setError(null);
    try {
      const row = { content: text, user_id: user.id, cell_slug: activeSlug };
      const { error: insertError } = await supabase.from('messages').insert([row]);

      if (insertError) {
        if (insertError.message?.includes('cell_slug')) {
          const { error: fallbackErr } = await supabase.from('messages').insert([
            { content: text, user_id: user.id },
          ]);
          if (fallbackErr) throw fallbackErr;
        } else {
          throw insertError;
        }
      }
      setNewMessage('');
    } catch (err) {
      console.error(err);
      setError(`${t('chat_error_send')} ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const openCreateCell = () => {
    if (!user) {
      setCreateNotice({ type: 'err', text: t('cells_create_login') });
      return;
    }
    if (!allowCreateCell) {
      setPaywallOpen(true);
      return;
    }
    setCreateNotice(null);
    setCreateLanguage(i18n.language?.split('-')[0] || 'fr');
    setShowCreateCell(true);
  };

  const handleCreateCell = async (e) => {
    e.preventDefault();
    const name = createName.trim();
    if (!name || !session?.access_token) return;

    setCreateBusy(true);
    setCreateNotice(null);
    try {
      const cell = await createCell(
        { name, description: createDescription.trim(), language: createLanguage },
        session.access_token
      );
      await loadCustomCells();
      setShowCreateCell(false);
      setCreateName('');
      setCreateDescription('');
      setActiveSlug(cell.slug);
      setCreateNotice({ type: 'ok', text: t('cells_create_success') });
    } catch (err) {
      if (err.data?.error === 'cells_create_forbidden' || err.status === 403) {
        setCreateNotice({ type: 'err', text: t('cells_create_forbidden') });
      } else {
        setCreateNotice({ type: 'err', text: t('cells_create_error') });
      }
    } finally {
      setCreateBusy(false);
    }
  };

  const createLangOptions = [
    { value: 'global', labelKey: 'cells_room_global' },
    { value: 'fr', labelKey: 'cells_room_fr' },
    { value: 'en', labelKey: 'cells_room_en' },
    { value: 'es', labelKey: 'cells_room_es' },
    { value: 'nl', labelKey: 'cells_room_nl' },
    { value: 'pt', labelKey: 'cells_room_pt' },
    { value: 'ar', labelKey: 'cells_room_ar' },
  ];

  const selectRoom = (slug) => {
    setActiveSlug(slug);
    setError(null);
  };

  return (
    <div className="cells-page animate-fade-in">
      <header className="cells-hero">
        <div className="cells-hero-glow" aria-hidden />
        <div className="cells-hero-inner container">
          <div className="cells-hero-mark">
            <CellsLogo size={44} title={t('cells_page_title')} />
          </div>
          <div className="cells-hero-copy">
            <p className="cells-hero-eyebrow">{t('home_section_eyebrow')}</p>
            <h1 className="cells-hero-title">{t('cells_page_title')}</h1>
            <p className="cells-hero-subtitle">{t('cells_page_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container cells-body">
        {createNotice && (
          <p className={`cells-banner cells-banner--${createNotice.type}`} role="status">
            {createNotice.text}
          </p>
        )}

        {!user && (
          <div className="cells-strip">
            <span>{t('cells_members_hint')}</span>
            <Link to="/auth" className="btn btn-primary btn-sm">
              {t('layout_login')}
            </Link>
          </div>
        )}

        {user && !allowCreateCell && (
          <div className="cells-strip cells-strip--muted">
            <span>{t('cells_create_forbidden')}</span>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setPaywallOpen(true)}>
              {t('cells_create_upgrade_premium')}
            </button>
          </div>
        )}

        <div className="cells-layout">
          <aside className="cells-sidebar" aria-label={t('cells_pick_room')}>
            <div className="cells-sidebar-head">
              <h2 className="cells-sidebar-title">{t('cells_pick_room')}</h2>
              {user && (
                <button type="button" className="btn btn-outline btn-sm cells-sidebar-create" onClick={openCreateCell}>
                  <Plus size={16} aria-hidden />
                  {t('cells_create')}
                </button>
              )}
            </div>

            <section className="cells-sidebar-block">
              <h3 className="cells-sidebar-label">
                <CellsLogo size={14} title={t('cells_section_official')} />
                {t('cells_section_official')}
              </h3>
              <div className="cells-room-list" role="tablist" aria-label={t('cells_section_official')}>
                {CELL_ROOMS.map((room) => (
                  <button
                    key={room.slug}
                    type="button"
                    role="tab"
                    aria-selected={activeSlug === room.slug}
                    className={`cells-room-chip ${activeSlug === room.slug ? 'cells-room-chip--active' : ''}`}
                    onClick={() => selectRoom(room.slug)}
                  >
                    {room.slug === 'global' && <Globe size={14} aria-hidden />}
                    {t(room.labelKey)}
                  </button>
                ))}
              </div>
            </section>

            <section className="cells-sidebar-block">
              <h3 className="cells-sidebar-label">
                <CommunityLogo size={14} title={t('cells_section_custom')} />
                {t('cells_section_custom')}
              </h3>
              <div className="cells-room-list cells-room-list--custom" role="tablist" aria-label={t('cells_section_custom')}>
                {customCells.length === 0 ? (
                  <p className="cells-sidebar-empty">{t('cells_custom_empty')}</p>
                ) : (
                  customCells.map((cell) => (
                    <button
                      key={cell.id}
                      type="button"
                      role="tab"
                      aria-selected={activeSlug === cell.slug}
                      className={`cells-room-chip cells-room-chip--custom ${activeSlug === cell.slug ? 'cells-room-chip--active' : ''}`}
                      onClick={() => selectRoom(cell.slug)}
                      title={cell.description || undefined}
                    >
                      <span className="cells-room-chip-name">{cell.name}</span>
                      {cell.created_by === user?.id && (
                        <span className="cells-host-badge">{t('cells_host_badge')}</span>
                      )}
                    </button>
                  ))
                )}
                {user ? (
                  <button
                    type="button"
                    className="cells-room-chip cells-room-chip--dashed"
                    onClick={openCreateCell}
                  >
                    <Plus size={14} aria-hidden />
                    {t('cells_create')}
                  </button>
                ) : (
                  <Link to="/auth" className="cells-room-chip cells-room-chip--dashed">
                    <Plus size={14} aria-hidden />
                    {t('cells_create_login')}
                  </Link>
                )}
              </div>
            </section>
          </aside>

          <section className="cells-chat" aria-label={activeRoomLabel}>
            <div className="cells-chat-head">
              <div>
                <h2 className="cells-chat-title">{activeRoomLabel}</h2>
                <p className="cells-chat-meta">
                  {loading ? t('cells_loading') : t('cells_message_count', { count: messages.length })}
                </p>
              </div>
            </div>

            {error && (
              <p className="cells-banner cells-banner--err" role="alert">
                {error}
              </p>
            )}

            <div className={`cells-chat-feed${loading ? ' cells-chat-feed--loading' : ''}`}>
              {loading ? (
                <div className="cells-chat-status">
                  <Loader2 size={22} className="cells-spin" aria-hidden />
                  <span>{t('cells_loading')}</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="cells-chat-empty">
                  <CellsLogo size={36} title={t('cells_page_title')} />
                  <p className="cells-chat-empty-title">{t('cells_empty_welcome')}</p>
                  <p className="cells-chat-empty-hint">{t('cells_empty_hint')}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.user_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`cells-msg ${isMine ? 'cells-msg--mine' : 'cells-msg--other'}`}
                    >
                      <ProfileAvatar
                        src={isMine ? profile?.avatar_url : msg.authorAvatar}
                        name={
                          isMine ? profile?.name || user?.user_metadata?.name : msg.authorName
                        }
                        size={36}
                      />
                      <div className="cells-msg-bubble">
                        {!isMine && <span className="cells-msg-author">{msg.authorName}</span>}
                        <p className="cells-msg-text">{msg.content}</p>
                        <time className="cells-msg-time" dateTime={msg.created_at}>
                          {formatTime(msg.created_at)}
                        </time>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="cells-chat-anchor" />
            </div>

            <form onSubmit={handleSendMessage} className="cells-composer">
              <input
                type="text"
                className="cells-composer-input"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={user ? t('chat_placeholder') : t('cells_members_hint')}
                maxLength={500}
                disabled={sending || !user}
                aria-label={t('chat_placeholder')}
              />
              <button
                type="submit"
                className="btn btn-primary cells-composer-send"
                disabled={sending || !newMessage.trim() || !user}
                aria-label={t('chat_live')}
              >
                {sending ? <Loader2 size={18} className="cells-spin" aria-hidden /> : <Send size={18} aria-hidden />}
              </button>
            </form>
          </section>
        </div>
      </div>

      {showCreateCell && (
        <div className="cells-modal-backdrop" role="presentation" onClick={() => setShowCreateCell(false)}>
          <div
            className="cells-modal"
            role="dialog"
            aria-labelledby="cells-create-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="cells-create-title" className="cells-modal-title">
              {t('cells_create_title')}
            </h2>
            <p className="cells-modal-hint">{t('cells_create_banner_hint')}</p>
            <form onSubmit={handleCreateCell} className="cells-modal-form">
              <label className="cells-field-label" htmlFor="cells-create-name">
                {t('cells_create_name')}
              </label>
              <input
                id="cells-create-name"
                className="cells-field-input"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={t('cells_create_name_placeholder')}
                maxLength={80}
                required
                autoFocus
              />
              <label className="cells-field-label" htmlFor="cells-create-desc">
                {t('cells_create_description')}
              </label>
              <textarea
                id="cells-create-desc"
                className="cells-field-textarea"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder={t('cells_create_description_placeholder')}
                maxLength={280}
                rows={3}
              />
              <label className="cells-field-label" htmlFor="cells-create-lang">
                {t('cells_create_language')}
              </label>
              <select
                id="cells-create-lang"
                className="cells-field-input"
                value={createLanguage}
                onChange={(e) => setCreateLanguage(e.target.value)}
              >
                {createLangOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </select>
              <div className="cells-modal-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateCell(false)}
                  disabled={createBusy}
                >
                  {t('cells_create_cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={createBusy || !createName.trim()}>
                  {createBusy ? <Loader2 size={18} className="cells-spin" aria-hidden /> : <Plus size={18} aria-hidden />}
                  {t('cells_create_submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PaywallModal isOpen={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
};

export default Cells;
