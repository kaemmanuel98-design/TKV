import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Users, Map, Clock, Heart, Loader2, Quote } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAuthStore } from '../store/useAuthStore';
import { useProfileStore } from '../store/useProfileStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { supabase } from '../lib/supabase';
import './Community.css';

const shortcuts = [
  { to: '/cells', icon: Users, labelKey: 'community_cells_cta' },
  { to: '/map', icon: Map, labelKey: 'community_map_cta' },
  { to: '/heritage', icon: Clock, labelKey: 'community_heritage_cta' },
];

async function enrichCommunityPosts(rows, t) {
  const userIds = [...new Set(rows.map((p) => p.user_id))];
  let profileById = {};
  if (userIds.length > 0) {
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
      authorName: prof?.name || t('community_author_anonymous'),
      authorAvatar: prof?.avatar_url || null,
    };
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
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeType, setComposeType] = useState('post');
  const [feedFilter, setFeedFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [reactingId, setReactingId] = useState(null);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('community_posts')
        .select('id, created_at, content, reactions_count, user_id, post_type')
        .order('created_at', { ascending: false })
        .limit(50);

      if (feedFilter === 'testimony') {
        query = query.eq('post_type', 'testimony');
      }

      const { data: rows, error: fetchError } = await query;

      if (fetchError) {
        if (fetchError.message?.includes('post_type')) {
          const fallback = await supabase
            .from('community_posts')
            .select('id, created_at, content, reactions_count, user_id')
            .order('created_at', { ascending: false })
            .limit(50);
          if (fallback.error) throw fallback.error;
          const mapped = (fallback.data || []).map((p) => ({ ...p, post_type: 'post' }));
          setPosts(await enrichCommunityPosts(mapped, t));
          return;
        }
        throw fetchError;
      }

      setPosts(await enrichCommunityPosts(rows || [], t));
    } catch (err) {
      console.error(err);
      setError(t('community_error'));
    } finally {
      setLoading(false);
    }
  }, [t, feedFilter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const openCompose = (type) => {
    setComposeType(type);
    setComposing(true);
    setDraft('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        content: text,
        post_type: composeType === 'testimony' ? 'testimony' : 'post',
      };
      const { error: insertError } = await supabase.from('community_posts').insert(payload);
      if (insertError) throw insertError;
      setDraft('');
      setComposing(false);
      awardBadge('community');
      incrementCommunityPosts();
      await loadPosts();
    } catch (err) {
      console.error(err);
      setError(t('community_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (post) => {
    if (reactingId) return;
    setReactingId(post.id);
    const next = (post.reactions_count || 0) + 1;
    try {
      const { error: updateError } = await supabase
        .from('community_posts')
        .update({ reactions_count: next })
        .eq('id', post.id);
      if (updateError) throw updateError;
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, reactions_count: next } : p))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setReactingId(null);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="container community-page animate-fade-in">
      <PageHeader title={t('community_title')} subtitle={t('community_subtitle')} />

      <div className="community-shortcuts">
        {shortcuts.map(({ to, icon: Icon, labelKey }) => (
          <Link key={to} to={to} className="community-shortcut card">
            <Icon size={22} strokeWidth={1.5} />
            <span>{t(labelKey)}</span>
          </Link>
        ))}
      </div>

      <div className="community-filter-row">
        <button
          type="button"
          className={`community-filter-btn ${feedFilter === 'all' ? 'active' : ''}`}
          onClick={() => setFeedFilter('all')}
        >
          {t('community_filter_all')}
        </button>
        <button
          type="button"
          className={`community-filter-btn ${feedFilter === 'testimony' ? 'active' : ''}`}
          onClick={() => setFeedFilter('testimony')}
        >
          {t('community_filter_testimonies')}
        </button>
      </div>

      <div className="community-compose card">
        {user ? (
          composing ? (
            <form className="community-form" onSubmit={handleSubmit}>
              {composeType === 'testimony' && (
                <p className="community-compose-kind">
                  <Quote size={16} />
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
              />
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
                  disabled={submitting || !draft.trim()}
                >
                  {submitting ? <Loader2 size={16} className="spin" /> : null}
                  {composeType === 'testimony'
                    ? t('community_testimony_submit')
                    : t('community_post_submit')}
                </button>
              </div>
            </form>
          ) : (
            <div className="community-compose-actions">
              <button type="button" className="btn btn-outline" onClick={() => openCompose('post')}>
                <MessageCircle size={18} />
                {t('community_create_post')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => openCompose('testimony')}>
                <Quote size={18} />
                {t('community_create_testimony')}
              </button>
            </div>
          )
        ) : (
          <Link to="/auth" className="btn btn-primary">
            {t('community_login_to_post')}
          </Link>
        )}
      </div>

      {error && <p className="community-error">{error}</p>}

      <div className="community-feed">
        {loading ? (
          <p className="text-muted community-loading">
            <Loader2 size={20} className="spin" />
            {t('community_loading')}
          </p>
        ) : posts.length === 0 ? (
          <p className="text-muted text-center">{t('community_no_posts')}</p>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className={`card community-post ${post.post_type === 'testimony' ? 'community-post--testimony' : ''}`}
            >
              <header className="community-post-header">
                <div className="community-post-author-row">
                  <ProfileAvatar src={post.authorAvatar} name={post.authorName} size={40} />
                  <div>
                    <span className="community-post-author">{post.authorName}</span>
                    {post.post_type === 'testimony' && (
                      <span className="community-post-badge">{t('community_badge_testimony')}</span>
                    )}
                  </div>
                </div>
                <time className="community-post-date">{formatDate(post.created_at)}</time>
              </header>
              <p>{post.content}</p>
              <footer className="community-post-footer">
                <button
                  type="button"
                  className="community-reaction-btn"
                  onClick={() => handleReaction(post)}
                  disabled={reactingId === post.id}
                >
                  <Heart size={16} />
                  {t('community_reactions', { count: post.reactions_count || 0 })}
                </button>
              </footer>
            </article>
          ))
        )}
      </div>

    </div>
  );
};

export default Community;
