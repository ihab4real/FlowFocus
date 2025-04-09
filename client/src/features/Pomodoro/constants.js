// Timer modes
export const TIMER_MODES = {
  FOCUS: "focus",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak"
};

// Default settings
export const DEFAULT_SETTINGS = {
  FOCUS_DURATION: 25,
  SHORT_BREAK_DURATION: 5,
  LONG_BREAK_DURATION: 15,
  LONG_BREAK_INTERVAL: 4,
  AUTO_START_BREAKS: true,
  AUTO_START_POMODOROS: false,
  SOUND_ENABLED: true,
  SOUND_VOLUME: 80
};

// Timer colors
export const TIMER_COLORS = {
  FOCUS: "#6C63FF",
  SHORT_BREAK: "#4FD1C5",
  LONG_BREAK: "#FF6584"
};

// Timer titles
export const TIMER_TITLES = {
  FOCUS: "Focus Session",
  SHORT_BREAK: "Short Break",
  LONG_BREAK: "Long Break"
};

// Timer button classes
export const BUTTON_CLASSES = {
  FOCUS: "bg-[#6C63FF] hover:bg-[#6C63FF]/90",
  SHORT_BREAK: "bg-[#4FD1C5] hover:bg-[#4FD1C5]/90",
  LONG_BREAK: "bg-[#FF6584] hover:bg-[#FF6584]/90"
};

// Sound files
export const SOUND_FILES = {
  START: "/sounds/start.mp3",
  END: "/sounds/complete.mp3",
  BREAK_END: "/sounds/break-end.mp3"
};

// Timer dimensions
export const TIMER_DIMENSIONS = {
  FULLSCREEN: {
    WIDTH: "w-64",
    HEIGHT: "h-64",
    MARGIN: "mb-6",
    TEXT_SIZE: "text-6xl"
  },
  DEFAULT: {
    WIDTH: "w-40",
    HEIGHT: "h-40",
    MARGIN: "mb-4",
    TEXT_SIZE: "text-4xl"
  }
};

// Timer progress
export const TIMER_PROGRESS = {
  CIRCLE_RADIUS: 45,
  CIRCLE_STROKE_WIDTH: 8,
  CIRCLE_DASHARRAY: 283,
  CIRCLE_ROTATION: -90
};

// Timer completion
export const TIMER_COMPLETION = {
  NEAR_COMPLETION_THRESHOLD: 10,
  TOAST_DURATION: 3000,
  SOUND_TOAST_DURATION: 2000
};

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  TOGGLE_TIMER: "Space",
  RESET_TIMER: "KeyR",
  SKIP_SESSION: "KeyS",
  TOGGLE_FULLSCREEN: "KeyF",
  EXIT_FULLSCREEN: "Escape"
};

// Local storage keys
export const STORAGE_KEYS = {
  POMODORO_SETTINGS: "pomodoroSettings"
}; 