import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_NOTIFICATION_SETTINGS = {
  taskReminders: true,
  pomodoroComplete: true,
  habitReminders: true,
  emailNotifications: false,
};

/**
 * Settings store for user preferences (excluding auth and pomodoro which have their own stores)
 * Handles notification settings and other general user preferences
 */
const useSettingsStore = create(
  persist(
    (set, get) => ({
      // Notification settings
      notifications: DEFAULT_NOTIFICATION_SETTINGS,

      // Loading states
      isLoading: false,
      error: null,

      // Actions
      setNotifications: (notifications) => set({ notifications }),

      updateNotifications: (newNotifications) => {
        set({
          notifications: {
            ...get().notifications,
            ...newNotifications,
          },
        });
      },

      // Individual notification setters for convenience
      setTaskReminders: (enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            taskReminders: enabled,
          },
        })),

      setPomodoroComplete: (enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            pomodoroComplete: enabled,
          },
        })),

      setHabitReminders: (enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            habitReminders: enabled,
          },
        })),

      setEmailNotifications: (enabled) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            emailNotifications: enabled,
          },
        })),

      // Reset to defaults
      resetNotifications: () =>
        set({ notifications: DEFAULT_NOTIFICATION_SETTINGS }),

      // Set loading and error states
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Request notification permission
      requestNotificationPermission: async () => {
        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          return permission === "granted";
        }
        return false;
      },

      // Check if notifications are supported and permission granted
      canShowNotifications: () => {
        return (
          "Notification" in window && Notification.permission === "granted"
        );
      },

      // Show notification (helper method)
      showNotification: (title, options = {}) => {
        if (get().canShowNotifications()) {
          new Notification(title, {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            ...options,
          });
        }
      },
    }),
    {
      name: "flowfocus-settings-storage",
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);

export default useSettingsStore;
