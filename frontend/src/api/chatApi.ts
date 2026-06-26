import { API_BASE_URL, getToken, http } from './http';
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

  updateSession: (sessionId: string, data: { title?: string, isPinned?: boolean }) => {
    return http.patch<ChatSessionDto>(`/chat-sessions/${sessionId}`, data);
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

  streamMessage: async function* (sessionId: string, data: SendMessageData, signal?: AbortSignal) {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/chat-sessions/${sessionId}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to stream message: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6);
          if (dataStr === '[DONE]') continue;
          
          try {
            const event = JSON.parse(dataStr);
            yield event;
          } catch (e) {
            console.error('Failed to parse SSE JSON', e);
          }
        }
      }
    }
  },
};
