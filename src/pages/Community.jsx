import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Users, Map, Clock, Heart, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuthStore } from '../store/useAuthStore';
import { useGamificationStore } from '../store/useGamificationStore';
import { supabase } from '../lib/supabase';
import './Community.css';

const shortcuts = [
  { to: '/cells', icon: Users, labelKey: 'community_cells_cta' },
  { to: '/map', icon: Map, labelKey: 'community_map_cta' },
  { to: '/heritage', icon: Clock, labelKey: 'community_heritage_cta' },
];

const Community = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const awardBadge = useGamificationStore((s) => s.awardBadge);
  const incrementCommunityPosts = useGamificationStore((s) => s.incrementCommunityPosts);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState('');
  const [composing, setComposing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reactingId, setReactingId] = useState(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: rows, error: fetchError } = await supabase
        .from('community_posts')
        .select('id, created_at, content, reactions_count, user_id')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const userIds = [...new Set((rows || []).map((p) => p.user_id))];
      let nameById = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds);
        nameById = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
      }

      setPosts(
        (rows || []).map((p) => ({
          ...p,
          authorName: nameById[p.user_id] || t('community_author_anonymous'),
        }))
      );
    } catch (err) {
      console.error(err);
      setError(t('community_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user?.id) return;

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('community_posts').insert({
        user_id: user.id,
        content: text,
      });
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

      <div className="community-compose card">
        {user ? (
          composing ? (
            <form className="community-form" onSubmit={handleSubmit}>
              <textarea
                className="community-textarea"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t('community_post_placeholder')}
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
                  {t('community_post_submit')}
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="btn btn-outline" onClick={() => setComposing(true)}>
              <MessageCircle size={18} />
              {t('community_create_post')}
            </button>
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
            <article key={post.id} className="card community-post">
              <header className="community-post-header">
                <span className="community-post-author">{post.authorName}</span>
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
