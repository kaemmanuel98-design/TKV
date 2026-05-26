import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Send, Video } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Cells = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showVideo, setShowVideo] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (!user) {
      alert(t('chat_auth_required'));
      return;
    }

    try {
      const { error } = await supabase.from('messages').insert([{ content: newMessage, user_id: user.id }]);

      if (error) {
        console.error('Error sending message:', error);
        alert(`${t('chat_error_send')} ${error.message}`);
      } else {
        setNewMessage('');
      }
    } catch (err) {
      console.error('Exception:', err);
      alert(`${t('chat_error_unexpected')} ${err.message}`);
    }
  };

  return (
    <div className="container animate-fade-in cells-layout">
      <div className="flex-1 flex flex-col gap-4">
        <PageHeader
          eyebrow={t('cells')}
          title={t('chat_lobby')}
          subtitle={t('home_cells_desc')}
          showLogo
          actions={
            <button
              type="button"
              className={`btn btn-sm ${showVideo ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setShowVideo(!showVideo)}
            >
              <Video size={18} /> {showVideo ? t('chat_leave_video') : t('chat_join_video')}
            </button>
          }
        />

        <div className="card cells-video-card flex-1 flex items-center justify-center overflow-hidden p-0">
          {showVideo ? (
            <iframe
              src="https://meet.jit.si/TKV_GlobalCell_Demo"
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              title={t('chat_join_video')}
              style={{ width: '100%', height: '100%', border: 'none', minHeight: '400px' }}
            />
          ) : (
            <div className="cells-video-placeholder text-muted">
              <Video size={48} style={{ opacity: 0.45, margin: '0 auto 1rem' }} />
              <p>{t('chat_video_closed')}</p>
              <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('chat_video_instruction')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="card cells-chat flex flex-col">
        <h3 className="chat-head">{t('chat_live')}</h3>

        <div className="chat-feed">
          {messages.length === 0 ? (
            <p className="text-center text-muted">{t('chat_no_messages')}</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble ${msg.user_id === user?.id ? 'chat-bubble--mine' : 'chat-bubble--other'}`}
              >
                {msg.content}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input type="text" className="input" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={t('chat_placeholder')} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary" aria-label={t('chat_live')}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cells;
