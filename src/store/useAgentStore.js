import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const todayKey = () => new Date().toISOString().slice(0, 10);

const limits = {
  free: { chat: 3, perspectives: 0 },
  premium: { chat: 30, perspectives: 2 },
  premium_plus: { chat: 9999, perspectives: 9999 },
};

export const useAgentStore = create(
  persist(
    (set, get) => ({
      date: todayKey(),
      chatCount: 0,
      perspectivesCount: 0,
      messages: [],

      resetIfNewDay: () => {
        const today = todayKey();
        if (get().date !== today) {
          set({ date: today, chatCount: 0, perspectivesCount: 0 });
        }
      },

      getLimits: (planType = 'free') => limits[planType] || limits.free,

      canSendChat: (planType) => {
        get().resetIfNewDay();
        const { chat } = get().getLimits(planType);
        return get().chatCount < chat;
      },

      canAnalyzePerspectives: (planType) => {
        get().resetIfNewDay();
        const { perspectives } = get().getLimits(planType);
        return perspectives > 0 && get().perspectivesCount < perspectives;
      },

      sendMessage: (role, content, sources = null) => {
        set((state) => ({
          messages: [...state.messages, { role, content, sources, at: Date.now() }],
          chatCount: role === 'user' ? state.chatCount + 1 : state.chatCount,
        }));
      },

      incrementPerspectives: () => {
        get().resetIfNewDay();
        set({ perspectivesCount: get().perspectivesCount + 1 });
      },
    }),
    {
      name: 'tkv_agent_usage',
      partialize: (state) => ({
        date: state.date,
        chatCount: state.chatCount,
        perspectivesCount: state.perspectivesCount,
        messages: state.messages.slice(-40),
      }),
    }
  )
);
