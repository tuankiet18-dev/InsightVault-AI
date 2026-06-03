import { http } from './http';
import type { 
  ChatSessionDto, 
  CreateChatSessionRequest, 
  ChatMessageDto, 
  ChatTurnResponse,
  WebSearchOptions,
  ChatMessageContextRequest
} from '../types/api';

export interface SendMessageData {
  content: string;
  contexts?: ChatMessageContextRequest[];
  webSearchOptions?: WebSearchOptions;
}

export const chatApi = {
  // Chat Sessions
  getSessions: (workspaceId: string) => {
    return http.get<ChatSessionDto[]>(`/workspaces/${workspaceId}/chat-sessions`);
  },

  createSession: (workspaceId: string, data: CreateChatSessionRequest) => {
    return http.post<ChatSessionDto>(`/workspaces/${workspaceId}/chat-sessions`, data);
  },

  deleteSession: (sessionId: string) => {
    return http.delete<void>(`/chat-sessions/${sessionId}`);
  },

  // Messages
  getMessages: (sessionId: string) => {
    return http.get<ChatMessageDto[]>(`/chat-sessions/${sessionId}/messages`);
  },

  sendMessage: (sessionId: string, data: SendMessageData) => {
    return http.post<ChatTurnResponse>(`/chat-sessions/${sessionId}/messages`, data);
  },
};
