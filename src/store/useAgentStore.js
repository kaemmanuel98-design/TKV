import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const todayKey = () => new Date().toISOString().slice(0, 10);

const limits = {
  free: { chat: 3, perspectives: 0 },
  premium: { chat: 9999, perspectives: 9999 },
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

      syncUsageFromServer: (usage) => {
        if (!usage) return;
        get().resetIfNewDay();
        set({
          chatCount: usage.chat?.used ?? get().chatCount,
          perspectivesCount: usage.perspectives?.used ?? get().perspectivesCount,
        });
      },

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
        }));
      },

      startAssistantMessage: () => {
        set((state) => ({
          messages: [
            ...state.messages,
            { role: 'assistant', content: '', sources: null, at: Date.now(), streaming: true },
          ],
        }));
      },

      appendAssistantToken: (token) => {
        set((state) => {
          const messages = [...state.messages];
          const last = messages[messages.length - 1];
          if (last?.role !== 'assistant') return state;
          messages[messages.length - 1] = { ...last, content: last.content + token };
          return { messages };
        });
      },

      finishAssistantMessage: (sources = null) => {
        set((state) => {
          const messages = [...state.messages];
          const last = messages[messages.length - 1];
          if (last?.role !== 'assistant') return state;
          messages[messages.length - 1] = {
            ...last,
            sources: sources ?? last.sources,
            streaming: false,
          };
          return { messages };
        });
      },

      rollbackLastUserMessage: () => {
        set((state) => {
          const messages = [...state.messages];
          if (messages.length && messages[messages.length - 1]?.role === 'user') {
            messages.pop();
          }
          return { messages, chatCount: Math.max(0, state.chatCount - 1) };
        });
      },

      clearMessages: () => set({ messages: [] }),

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
