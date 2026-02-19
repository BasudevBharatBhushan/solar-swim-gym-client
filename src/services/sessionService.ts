import { apiClient } from './apiClient';
import { Session } from '../types';

export const sessionService = {
  getSessions: async (): Promise<Session[]> => {
    return apiClient.get('/sessions');
  },

  upsertSession: async (sessionData: Session): Promise<Session> => {
    return apiClient.post('/sessions/upsert', sessionData);
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete(`/sessions/${sessionId}`);
  }
};
