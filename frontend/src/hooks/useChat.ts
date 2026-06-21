import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi, type SendMessageData } from '../api/chatApi';
import type { CreateChatSessionRequest } from '../types/api';

export const chatKeys = {
  all: ['chats'] as const,
  workspace: (workspaceId: string) => [...chatKeys.all, workspaceId] as const,
  sessions: (workspaceId: string) => [...chatKeys.workspace(workspaceId), 'sessions'] as const,
  details: () => [...chatKeys.all, 'detail'] as const,
  detail: (id: string) => [...chatKeys.details(), id] as const,
  messages: (sessionId: string) => [...chatKeys.detail(sessionId), 'messages'] as const,
};

export const useChatSessions = (workspaceId: string | null) => {
  return useQuery({
    queryKey: chatKeys.sessions(workspaceId!),
    queryFn: () => chatApi.getSessions(workspaceId!),
    enabled: !!workspaceId,
  });
};

export const useCreateChatSession = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChatSessionRequest) => chatApi.createSession(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(workspaceId) });
    },
  });
};

export const useUpdateChatSession = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { title?: string; isPinned?: boolean } }) => 
      chatApi.updateSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(workspaceId) });
    },
  });
};

export const useDeleteChatSession = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(workspaceId) });
      queryClient.removeQueries({ queryKey: chatKeys.detail(deletedId) });
    },
  });
};

export const useChatMessages = (sessionId: string | null) => {
  return useQuery({
    queryKey: chatKeys.messages(sessionId!),
    queryFn: () => chatApi.getMessages(sessionId!),
    enabled: !!sessionId,
  });
};

export const useSendMessage = (sessionId: string, workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageData) => chatApi.sendMessage(sessionId, data),
    onSuccess: () => {
      // Typically, for chat, you might append the message optimistically.
      // We invalidate to re-fetch the latest list.
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(sessionId) });
      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(workspaceId) });
    },
  });
};
