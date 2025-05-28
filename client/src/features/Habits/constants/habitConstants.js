// Habit Categories with FlowFocus branding colors
export const HABIT_CATEGORIES = {
  Health: {
    label: "Health",
    color: "#4FD1C5", // Secondary teal
    icon: "🏃‍♀️",
    gradient: "from-teal-400 to-teal-600",
  },
  Productivity: {
    label: "Productivity",
    color: "#6C63FF", // Primary purple
    icon: "⚡",
    gradient: "from-purple-400 to-purple-600",
  },
  Learning: {
    label: "Learning",
    color: "#FF6584", // Accent pink
    icon: "📚",
    gradient: "from-pink-400 to-pink-600",
  },
  Wellness: {
    label: "Wellness",
    color: "#10B981", // Green
    icon: "🧘‍♀️",
    gradient: "from-green-400 to-green-600",
  },
  Custom: {
    label: "Custom",
    color: "#8B5CF6", // Purple variant
    icon: "⭐",
    gradient: "from-violet-400 to-violet-600",
  },
};

// Habit Types
export const HABIT_TYPES = {
  simple: {
    label: "Simple",
    description: "Just mark as done/undone",
    icon: "✓",
  },
  count: {
    label: "Count",
    description: "Track a specific number",
    icon: "#",
  },
  time: {
    label: "Time",
    description: "Track duration in minutes",
    icon: "⏱",
  },
};

// Common Units
export const HABIT_UNITS = {
  times: "times",
  minutes: "minutes",
  hours: "hours",
  glasses: "glasses",
  pages: "pages",
  steps: "steps",
  calories: "calories",
  kilometers: "km",
  repetitions: "reps",
};

// Pre-built Habit Templates
export const HABIT_TEMPLATES = [
  // Health Category
  {
    name: "Drink Water",
    description: "Stay hydrated throughout the day",
    category: "Health",
    type: "count",
    targetValue: 8,
    unit: "glasses",
    color: "#4FD1C5",
  },
  {
    name: "Exercise",
    description: "Daily physical activity",
    category: "Health",
    type: "time",
    targetValue: 30,
    unit: "minutes",
    color: "#4FD1C5",
  },
  {
    name: "Take Vitamins",
    description: "Daily vitamin intake",
    category: "Health",
    type: "simple",
    targetValue: 1,
    unit: "times",
    color: "#4FD1C5",
  },
  {
    name: "Walk 10k Steps",
    description: "Daily step goal",
    category: "Health",
    type: "count",
    targetValue: 10000,
    unit: "steps",
    color: "#4FD1C5",
  },

  // Productivity Category
  {
    name: "Deep Work Session",
    description: "Focused work without distractions",
    category: "Productivity",
    type: "time",
    targetValue: 90,
    unit: "minutes",
    color: "#6C63FF",
  },
  {
    name: "Check Email",
    description: "Process inbox efficiently",
    category: "Productivity",
    type: "simple",
    targetValue: 1,
    unit: "times",
    color: "#6C63FF",
  },
  {
    name: "Plan Tomorrow",
    description: "Prepare for the next day",
    category: "Productivity",
    type: "simple",
    targetValue: 1,
    unit: "times",
    color: "#6C63FF",
  },

  // Learning Category
  {
    name: "Read Books",
    description: "Daily reading habit",
    category: "Learning",
    type: "count",
    targetValue: 20,
    unit: "pages",
    color: "#FF6584",
  },
  {
    name: "Learn New Language",
    description: "Practice language skills",
    category: "Learning",
    type: "time",
    targetValue: 15,
    unit: "minutes",
    color: "#FF6584",
  },
  {
    name: "Online Course",
    description: "Complete course lessons",
    category: "Learning",
    type: "simple",
    targetValue: 1,
    unit: "times",
    color: "#FF6584",
  },

  // Wellness Category
  {
    name: "Meditation",
    description: "Daily mindfulness practice",
    category: "Wellness",
    type: "time",
    targetValue: 10,
    unit: "minutes",
    color: "#10B981",
  },
  {
    name: "Gratitude Journal",
    description: "Write down things you're grateful for",
    category: "Wellness",
    type: "simple",
    targetValue: 1,
    unit: "times",
    color: "#10B981",
  },
  {
    name: "Sleep 8 Hours",
    description: "Get adequate rest",
    category: "Wellness",
    type: "time",
    targetValue: 8,
    unit: "hours",
    color: "#10B981",
  },
];

// Progress States
export const PROGRESS_STATES = {
  not_started: {
    label: "Not Started",
    color: "#9CA3AF",
    bgColor: "#F3F4F6",
  },
  in_progress: {
    label: "In Progress",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bgColor: "#D1FAE5",
  },
};

// Streak Levels with FlowFocus theme
export const STREAK_LEVELS = {
  beginner: { min: 1, max: 6, label: "🔥 Getting Started", color: "#F59E0B" },
  building: {
    min: 7,
    max: 20,
    label: "💪 Building Momentum",
    color: "#6C63FF",
  },
  strong: { min: 21, max: 49, label: "🚀 Strong Habit", color: "#4FD1C5" },
  champion: { min: 50, max: 99, label: "🏆 Habit Champion", color: "#FF6584" },
  legend: {
    min: 100,
    max: Infinity,
    label: "👑 Habit Legend",
    color: "#8B5CF6",
  },
};

export const getStreakLevel = (streak) => {
  for (const [key, level] of Object.entries(STREAK_LEVELS)) {
    if (streak >= level.min && streak <= level.max) {
      return { key, ...level };
    }
  }
  return STREAK_LEVELS.beginner;
};
