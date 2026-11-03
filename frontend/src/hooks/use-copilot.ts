'use client';

import { useAppStore } from '@/lib/store';
import { useRoleStore } from '@/lib/store/useRoleStore';
import { copilotApi } from '@/lib/api';

export function useCopilot() {
  const isCopilotOpen = useAppStore((state) => state.isCopilotOpen);
  const toggleCopilot = useAppStore((state) => state.toggleCopilot);
  const setCopilotOpen = useAppStore((state) => state.setCopilotOpen);
  const copilotMessages = useAppStore((state) => state.copilotMessages);
  const isCopilotLoading = useAppStore((state) => state.isCopilotLoading);
  const addCopilotMessage = useAppStore((state) => state.addCopilotMessage);
  const clearCopilotMessages = useAppStore((state) => state.clearCopilotMessages);
  const setCopilotLoading = useAppStore((state) => state.setCopilotLoading);

  const sendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isCopilotLoading) return;

    const history = useAppStore.getState().copilotMessages;
    // Add the current prompt separately from the prior context.
    addCopilotMessage({
      sender: 'user',
      content: userPrompt.trim(),
    });

    setCopilotLoading(true);

    try {
      const activeRole = useRoleStore.getState().role;
      // 2. Fetch intelligent grounded response from Gemini + MCP tools
      const assistantMessage = await copilotApi.sendQuery(userPrompt, activeRole, history);
      addCopilotMessage({
        sender: 'assistant',
        content: assistantMessage.content,
        citations: assistantMessage.citations,
        suggestedActions: assistantMessage.suggestedActions,
        toolCalls: assistantMessage.toolCalls,
        rolePerspective: assistantMessage.rolePerspective,
        inferenceMode: assistantMessage.inferenceMode,
      });
    } catch (error) {
      addCopilotMessage({
        sender: 'system',
        content: error instanceof Error ? error.message : 'Copilot temporarily unavailable. Please retry.',
      });
    } finally {
      setCopilotLoading(false);
    }
  };

  return {
    isOpen: isCopilotOpen,
    toggle: toggleCopilot,
    setOpen: setCopilotOpen,
    messages: copilotMessages,
    isLoading: isCopilotLoading,
    sendMessage,
    clearMessages: clearCopilotMessages,
  };
}
