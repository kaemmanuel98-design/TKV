import { supabase } from './supabase';

export async function fetchFriendMessages(myId, friendId, limit = 80) {
  const { data, error } = await supabase
    .from('friend_messages')
    .select('id, created_at, content, sender_id, recipient_id')
    .or(
      `and(sender_id.eq.${myId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${myId})`
    )
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function sendFriendMessage(senderId, recipientId, content) {
  const text = content.trim();
  if (!text) throw new Error('empty_message');

  const { data, error } = await supabase
    .from('friend_messages')
    .insert({
      sender_id: senderId,
      recipient_id: recipientId,
      content: text.slice(0, 2000),
    })
    .select('id, created_at, content, sender_id, recipient_id')
    .single();

  if (error) throw error;
  return data;
}

export async function verifyFriendship(myId, otherId) {
  const { data, error } = await supabase.rpc('are_friends', {
    user_a: myId,
    user_b: otherId,
  });
  if (error) {
    const rows = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(
        `and(from_user_id.eq.${myId},to_user_id.eq.${otherId}),and(from_user_id.eq.${otherId},to_user_id.eq.${myId})`
      )
      .limit(1);
    return Boolean(rows.data?.length);
  }
  return Boolean(data);
}
