import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pomodoroService } from '@/services/api/pomodoroService';
import { toast } from 'react-hot-toast';
import { TIMER_COMPLETION } from '../constants';

export const usePomodoroSettings = () => {
  return useQuery({
    queryKey: ['pomodoroSettings'],
    queryFn: () => pomodoroService.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdatePomodoroSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) => pomodoroService.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoroSettings'] });
      toast.success('Settings updated', {
        icon: '⚙️',
        duration: TIMER_COMPLETION.SOUND_TOAST_DURATION,
      });
    },
    onError: (error) => {
      toast.error('Failed to update settings');
      console.error('Settings update error:', error);
    },
  });
};

export const usePomodoroSessions = (params = {}) => {
  return useQuery({
    queryKey: ['pomodoroSessions', params],
    queryFn: () => pomodoroService.getSessions(params),
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const useCreatePomodoroSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionData) => pomodoroService.createSession(sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoroSessions'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoroStats'] });
    },
    onError: (error) => {
      toast.error('Failed to create session');
      console.error('Session creation error:', error);
    },
  });
};

export const useUpdatePomodoroSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, sessionData }) => pomodoroService.updateSession(id, sessionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pomodoroSessions'] });
      queryClient.invalidateQueries({ queryKey: ['pomodoroStats'] });
    },
    onError: (error) => {
      toast.error('Failed to update session');
      console.error('Session update error:', error);
    },
  });
};

export const usePomodoroStats = (params = {}) => {
  return useQuery({
    queryKey: ['pomodoroStats', params],
    queryFn: () => pomodoroService.getSessionStats(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 