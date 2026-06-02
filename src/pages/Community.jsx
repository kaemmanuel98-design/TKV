import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  MessageCircle,
  Heart,
  Loader2,
  Quote,
  Trash2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import {
  CommunityLogo,
  FriendsLogo,
  MapLogo,
  HeritageLogo,
} from '../components/SectionLogos';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { supabase } from '../lib/supabase';
import { hasReacted, markReacted, unmarkReacted } from '../lib/communityReactions';
import './Community.css';

const shortcuts = [
  { to: '/friends', mark: FriendsLogo, labelKey: 'friends_nav' },
  { to: '/map', mark: MapLogo, labelKey: 'community_map_cta' },
  { to: '/heritage', mark: HeritageLogo, labelKey: 'community_heritage_cta' },
];

const PAGE_SIZE = 20;
const COMMUNITY_LAST_POST_AT_KEY = 'tkv_community_last_post_at';
const COMMUNITY_POST_COOLDOWN_MS = 30 * 1000;

function getRemainingCooldownSeconds() {
  try {
    const last = Number(localStorage.getItem(COMMUNITY_LAST_POST_AT_KEY) || 0);
    const remainingMs = Math.max(0, last + COMMUNITY_POST_COOLDOWN_MS - Date.now());
    return Math.ceil(remainingMs / 1000);
  } catch {
    return 0;
  }
}

async function enrichCommunityPosts(rows, t) {
  if (!rows?.length) return [];
  const userIds = [...new Set(rows.map((p) => p.user_id).filter(Boolean))];
  let profileById = {};
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds);
    profileById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  return rows.map((p) => {
    const prof = profileById[p.user_id];
    return {
      ...p,
      post_type: p.post_type || 'post',
      moderation_status: p.moderation_status || 'approved',
      authorName: prof?.name || t('community_author_anonymous'),
      authorAvatar: prof?.avatar_url || null,
    };
  });
}

function formatRelativeTime(iso, t) {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return t('community_time_just_now');
  if (mins < 60) return t('community_time_minutes', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('community_time_hours', { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('community_time_days', { count: days });
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const awardBadge = useGamificationStore((s) => s.awardBadge);
  const incrementCommunityPosts = useGamificationStore((s) => s.incrementCommunityPosts);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeType, setComposeType] = useState('post');
  const [feedFilter, setFeedFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [reactingId, setReactingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [reactedIds, setReactedIds] = useState(() => new Set());
  const [feedCounts, setFeedCounts] = useState({ all: 0, testimony: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraftByPost, setCommentDraftByPost] = useState({});
  const [commentSubmittingPostId, setCommentSubmittingPostId] = useState('');

  const loadCommentsForPosts = useCallback(async (rows) => {
    const ids = [...new Set((rows || []).map((p) => p.id).filter(Boolean))];
    if (!ids.length) return;
    const { data, error: commentsError } = await supabase
      .from('community_comments')
      .select('id, post_id, user_id, content, created_at')
      .in('post_id', ids)
      .order('created_at', { ascending: true });
    if (commentsError) return;
    const userIds = [...new Set((data || []).map((c) => c.user_id).filter(Boolean))];
    let profilesMap = {};
    if (userIds.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')
        .in('id', userIds);
      profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    }
    const grouped = {};
    for (const c of data || []) {
      if (!grouped[c.post_id]) grouped[c.post_id] = [];
      grouped[c.post_id].push({
        ...c,
        authorName: profilesMap[c.user_id]?.name || t('community_author_anonymous'),
        authorAvatar: profilesMap[c.user_id]?.avatar_url || null,
      });
    }
    setCommentsByPost((prev) => ({ ...prev, ...grouped }));
  }, [t]);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const refreshFeedCounts = useCallback(async () => {
    try {
      const [{ count: all }, { count: testimony }] = await Promise.all([
        supabase.from('community_posts').select('*', { count: 'exact', head: true }),
        supabase
          .from('community_posts')
          .select('*', { count: 'exact', head: true })
          .eq('post_type', 'testimony'),
      ]);
      setFeedCounts({ all: all ?? 0, testimony: testimony ?? 0 });
    } catch {
      /* ignore count errors */
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('community_posts')
        .select('id, created_at, content, reactions_count, user_id, post_type, moderation_status')
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (feedFilter === 'testimony') {
        query = query.eq('post_type', 'testimony');
      }
      query = query.eq('moderation_status', 'approved');

      const { data: rows, error: fetchError } = await query;

      if (fetchError) {
        if (
          fetchError.message?.includes('post_type') ||
          fetchError.message?.includes('moderation_status')
        ) {
          const fallback = await supabase
            .from('community_posts')
            .select('id, created_at, content, reactions_count, user_id')
            .order('created_at', { ascending: false })
            .range(0, PAGE_SIZE - 1);
          if (fallback.error) throw fallback.error;
          const mapped = (fallback.data || []).map((p) => ({ ...p, post_type: 'post' }));
          const enriched = await enrichCommunityPosts(mapped, t);
          setPosts(enriched);
          setPage(1);
          setHasMore((fallback.data || []).length === PAGE_SIZE);
          return;
        }
        throw fetchError;
      }

      const safeRows = rows || [];
      const enriched = await enrichCommunityPosts(safeRows, t);
      setPosts(enriched);
      await loadCommentsForPosts(safeRows);
      setPage(1);
      setHasMore(safeRows.length === PAGE_SIZE);
      await refreshFeedCounts();
    } catch (err) {
      console.error(err);
      setError(t('community_error'));
    } finally {
      setLoading(false);
    }
  }, [t, feedFilter, refreshFeedCounts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const loadMorePosts = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('community_posts')
        .select('id, created_at, content, reactions_count, user_id, post_type, moderation_status')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (feedFilter === 'testimony') {
        query = query.eq('post_type', 'testimony');
      }
      query = query.eq('moderation_status', 'approved');

      const { data: rows, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      const safeRows = rows || [];
      const enriched = await enrichCommunityPosts(safeRows, t);
      setPosts((prev) => [...prev, ...enriched.filter((p) => !prev.some((e) => e.id === p.id))]);
      await loadCommentsForPosts(safeRows);
      setPage((p) => p + 1);
      setHasMore(safeRows.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
      setError(t('community_error'));
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('community-posts-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_posts' },
        async (payload) => {
          if ((payload.new?.moderation_status || 'approved') !== 'approved') return;
          const enriched = await enrichCommunityPosts([payload.new], t);
          const post = enriched[0];
          if (!post) return;
          if (feedFilter === 'testimony' && post.post_type !== 'testimony') return;
          setPosts((prev) => {
            if (prev.some((p) => p.id === post.id)) return prev;
            return [post, ...prev];
          });
          refreshFeedCounts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_posts' },
        (payload) => {
          setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
          refreshFeedCounts();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_comments' },
        async (payload) => {
          const row = payload.new;
          if (!row?.post_id) return;
          let authorName = t('community_author_anonymous');
          let authorAvatar = null;
          if (row.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', row.user_id)
              .maybeSingle();
            authorName = profile?.name || authorName;
            authorAvatar = profile?.avatar_url || null;
          }
          setCommentsByPost((prev) => ({
            ...prev,
            [row.post_id]: [...(prev[row.post_id] || []), { ...row, authorName, authorAvatar }],
          }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'community_comments' },
        (payload) => {
          const row = payload.old;
          if (!row?.post_id) return;
          setCommentsByPost((prev) => ({
            ...prev,
            [row.post_id]: (prev[row.post_id] || []).filter((c) => c.id !== row.id),
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [feedFilter, t, refreshFeedCounts]);

  const openCompose = (type) => {
    setComposeType(type);
    setComposing(true);
    setDraft('');
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user?.id) return;
    if (text.length < 8) {
      setError(t('community_min_length_error'));
      return;
    }
    const remainingCooldown = getRemainingCooldownSeconds();
    if (remainingCooldown > 0) {
      setError(t('community_cooldown_error', { seconds: remainingCooldown }));
      return;
    }
    const duplicateRecent = posts.some(
      (p) =>
        p.user_id === user.id &&
        p.content?.trim().toLowerCase() === text.toLowerCase() &&
        Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 60 * 12
    );
    if (duplicateRecent) {
      setError(t('community_duplicate_error'));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        user_id: user.id,
        content: text,
        post_type: composeType === 'testimony' ? 'testimony' : 'post',
        moderation_status: 'pending',
      };
      const { data, error: insertError } = await supabase
        .from('community_posts')
        .insert(payload)
        .select('id, created_at, content, reactions_count, user_id, post_type, moderation_status')
        .single();
      if (insertError) throw insertError;

      const enriched = await enrichCommunityPosts([data], t);
      if (enriched[0] && (enriched[0].moderation_status || 'approved') === 'approved') {
        setPosts((prev) => {
          if (prev.some((p) => p.id === enriched[0].id)) return prev;
          return [enriched[0], ...prev];
        });
      }

      setDraft('');
      setComposing(false);
      localStorage.setItem(COMMUNITY_LAST_POST_AT_KEY, String(Date.now()));
      awardBadge('community');
      incrementCommunityPosts();
      setSuccess(
        composeType === 'testimony'
          ? t('community_post_pending_review_testimony')
          : t('community_post_pending_review')
      );
      refreshFeedCounts();
    } catch (err) {
      console.error(err);
      const key = String(err?.message || '').trim();
      if (key === 'community_cooldown') {
        const secondsRaw = Number(err?.details || err?.detail || 30);
        const seconds = Number.isFinite(secondsRaw) && secondsRaw > 0 ? Math.ceil(secondsRaw) : 30;
        setError(t('community_cooldown_error', { seconds }));
      } else if (key === 'community_duplicate') {
        setError(t('community_duplicate_error'));
      } else if (key === 'community_min_length') {
        setError(t('community_min_length_error'));
      } else {
        setError(t('community_error_publish'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (post) => {
    if (reactingId || !user) return;
    setReactingId(post.id);
    const already = reactedIds.has(post.id) || hasReacted(post.id);
    const next = Math.max(0, (post.reactions_count || 0) + (already ? -1 : 1));

    try {
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({ reactions_count: next })
        .eq('id', post.id);
      if (updateError) throw updateError;

      if (already) {
        unmarkReacted(post.id);
        setReactedIds((prev) => {
          const nextSet = new Set(prev);
          nextSet.delete(post.id);
          return nextSet;
        });
      } else {
        markReacted(post.id);
        setReactedIds((prev) => new Set(prev).add(post.id));
      }

      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, reactions_count: next } : p))
      );
    } catch (err) {
      console.error(err);
      setError(t('community_error_reaction'));
    } finally {
      setReactingId(null);
    }
  };

  const handleDelete = async (post) => {
    if (!user || post.user_id !== user.id || deletingId) return;
    if (!window.confirm(t('community_delete_confirm'))) return;

    setDeletingId(post.id);
    setError(null);
    try {
      const { error: deleteError } = await supabase.from('community_posts').delete().eq('id', post.id);
      if (deleteError) throw deleteError;
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
      unmarkReacted(post.id);
      setReactedIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(post.id);
        return nextSet;
      });
      refreshFeedCounts();
    } catch (err) {
      console.error(err);
      setError(t('community_error_delete'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitComment = async (postId) => {
    if (!user?.id || !postId || commentSubmittingPostId) return;
    const text = String(commentDraftByPost[postId] || '').trim();
    if (!text) return;
    setCommentSubmittingPostId(postId);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('community_comments')
        .insert({ post_id: postId, user_id: user.id, content: text })
        .select('id, post_id, user_id, content, created_at')
        .single();
      if (insertError) throw insertError;
      const myName = useProfileStore.getState().profile?.name || t('community_author_anonymous');
      const myAvatar = useProfileStore.getState().profile?.avatar_url || null;
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), { ...data, authorName: myName, authorAvatar: myAvatar }],
      }));
      setCommentDraftByPost((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error(err);
      setError(t('community_error_comment'));
    } finally {
      setCommentSubmittingPostId('');
    }
  };

  const filteredEmpty =
    !loading &&
    posts.length === 0 &&
    (feedFilter === 'testimony' ? t('community_no_testimonies') : t('community_no_posts'));

  return (
    <div className="community-page animate-fade-in">
      <header className="community-hero">
        <div className="community-hero-glow" aria-hidden />
        <div className="community-hero-inner container">
          <div className="community-hero-mark">
            <CommunityLogo size={44} title={t('community_title')} />
          </div>
          <div className="community-hero-copy">
            <p className="community-hero-eyebrow">{t('home_section_eyebrow')}</p>
            <h1 className="community-hero-title">{t('community_title')}</h1>
            <p className="community-hero-subtitle">{t('community_subtitle')}</p>
          </div>
        </div>
      </header>

      <div className="container community-body">
        <nav className="community-toolbar" aria-label={t('community_title')}>
          {shortcuts.map(({ to, mark: Mark, labelKey }) => (
            <Link key={to} to={to} className="community-toolbar-link">
              <Mark size={20} title={t(labelKey)} />
              <span>{t(labelKey)}</span>
            </Link>
          ))}
        </nav>

        <div className="community-tabs" role="tablist" aria-label={t('community_filter_all')}>
          <button
            type="button"
            role="tab"
            aria-selected={feedFilter === 'all'}
            className={`community-tab ${feedFilter === 'all' ? 'is-active' : ''}`}
            onClick={() => setFeedFilter('all')}
          >
            {t('community_filter_all')}
            {!loading && (
              <span className="community-tab-count">{feedCounts.all}</span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={feedFilter === 'testimony'}
            className={`community-tab ${feedFilter === 'testimony' ? 'is-active' : ''}`}
            onClick={() => setFeedFilter('testimony')}
          >
            {t('community_filter_testimonies')}
            {!loading && (
              <span className="community-tab-count">{feedCounts.testimony}</span>
            )}
          </button>
        </div>

        <section className="community-compose" aria-label={t('community_create_post')}>
          {user ? (
            composing ? (
              <form className="community-form" onSubmit={handleSubmit}>
                {composeType === 'testimony' && (
                  <p className="community-compose-kind">
                    <Quote size={16} aria-hidden />
                    {t('community_badge_testimony')}
                  </p>
                )}
                <textarea
                  className="community-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    composeType === 'testimony'
                      ? t('community_testimony_placeholder')
                      : t('community_post_placeholder')
                  }
                  rows={4}
                  maxLength={2000}
                  required
                  autoFocus
                />
                <p className="community-char-count">
                  {t('community_chars_count', { count: draft.length, max: 2000 })}
                </p>
                <div className="community-form-actions">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setComposing(false);
                      setDraft('');
                    }}
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submitting || !draft.trim() || draft.trim().length < 8}
                  >
                    {submitting ? <Loader2 size={16} className="community-spin" /> : null}
                    {composeType === 'testimony'
                      ? t('community_testimony_submit')
                      : t('community_post_submit')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="community-compose-prompt">
                <button
                  type="button"
                  className="community-compose-trigger"
                  onClick={() => openCompose('post')}
                >
                  {t('community_post_placeholder')}
                </button>
                <div className="community-compose-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => openCompose('post')}>
                    <MessageCircle size={16} aria-hidden />
                    {t('community_create_post')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => openCompose('testimony')}
                  >
                    <Quote size={16} aria-hidden />
                    {t('community_create_testimony')}
                  </button>
                </div>
              </div>
            )
          ) : (
            <Link to="/auth" className="btn btn-primary community-compose-login">
              {t('community_login_to_post')}
              <ChevronRight size={16} aria-hidden />
            </Link>
          )}
        </section>

        {success && (
          <p className="community-notice community-notice--ok" role="status">
            {success}
          </p>
        )}
        {error && (
          <p className="community-notice community-notice--err" role="alert">
            {error}
          </p>
        )}

        <section className="community-feed" aria-live="polite">
          {loading ? (
            <p className="community-loading">
              <Loader2 size={20} className="community-spin" aria-hidden />
              {t('community_loading')}
            </p>
          ) : posts.length === 0 ? (
            <div className="community-empty">
              <Sparkles size={40} className="community-empty-icon" aria-hidden />
              <p className="community-empty-title">{filteredEmpty}</p>
              <p className="community-empty-desc">{t('community_empty_hint')}</p>
              {user && (
                <div className="community-empty-actions">
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => openCompose('post')}>
                    {t('community_create_post')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            posts.map((post) => {
              const reacted = reactedIds.has(post.id) || hasReacted(post.id);
              const isMine = user?.id === post.user_id;
              return (
                <article
                  key={post.id}
                  className={`community-post ${post.post_type === 'testimony' ? 'community-post--testimony' : ''}`}
                >
                  <header className="community-post-header">
                    <div className="community-post-author-row">
                      <ProfileAvatar src={post.authorAvatar} name={post.authorName} size={40} />
                      <div className="community-post-author-block">
                        <span className="community-post-author">{post.authorName}</span>
                        {post.post_type === 'testimony' && (
                          <span className="community-post-badge">{t('community_badge_testimony')}</span>
                        )}
                      </div>
                    </div>
                    <div className="community-post-meta">
                      <time className="community-post-date" dateTime={post.created_at}>
                        {formatRelativeTime(post.created_at, t)}
                      </time>
                      {isMine && (
                        <button
                          type="button"
                          className="community-delete-btn"
                          onClick={() => handleDelete(post)}
                          disabled={deletingId === post.id}
                          aria-label={t('community_delete_post')}
                        >
                          {deletingId === post.id ? (
                            <Loader2 size={14} className="community-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </header>
                  <p className="community-post-content">{post.content}</p>
                  <footer className="community-post-footer">
                    <div className="community-post-actions">
                      <button
                        type="button"
                        className={`community-reaction-btn ${reacted ? 'community-reaction-btn--active' : ''}`}
                        onClick={() => handleReaction(post)}
                        disabled={reactingId === post.id || !user}
                        title={user ? undefined : t('community_login_to_react')}
                      >
                        <Heart size={16} fill={reacted ? 'currentColor' : 'none'} aria-hidden />
                        {t('community_reactions', { count: post.reactions_count || 0 })}
                      </button>
                      <span className="community-comment-count">
                        <MessageCircle size={14} aria-hidden />
                        {t('community_comments_count', { count: (commentsByPost[post.id] || []).length })}
                      </span>
                    </div>
                    <div className="community-comments">
                      {(commentsByPost[post.id] || []).map((comment) => (
                        <div key={comment.id} className="community-comment-item">
                          <ProfileAvatar src={comment.authorAvatar} name={comment.authorName} size={28} />
                          <div className="community-comment-body">
                            <strong>{comment.authorName}</strong>
                            <p>{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      {user ? (
                        <div className="community-comment-form">
                          <input
                            className="input"
                            value={commentDraftByPost[post.id] || ''}
                            onChange={(e) =>
                              setCommentDraftByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            placeholder={t('community_comment_placeholder')}
                            maxLength={1000}
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={
                              commentSubmittingPostId === post.id ||
                              !String(commentDraftByPost[post.id] || '').trim()
                            }
                          >
                            {t('community_comment_submit')}
                          </button>
                        </div>
                      ) : (
                        <p className="text-muted community-comment-login">{t('community_login_to_comment')}</p>
                      )}
                    </div>
                  </footer>
                </article>
              );
            })
          )}
          {!loading && posts.length > 0 && hasMore && (
            <div className="community-load-more-wrap">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={loadMorePosts}
                disabled={loadingMore}
              >
                {loadingMore ? <Loader2 size={16} className="community-spin" /> : null}
                {loadingMore ? t('community_loading_more') : t('community_load_more')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Community;
