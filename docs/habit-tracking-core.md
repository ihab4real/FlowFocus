# Habit Tracking - Core Feature

## 📌 Overview

The Habit Tracking feature enables users to build and maintain daily routines through consistent behavior tracking. Habits focus on **consistency and routine building** through daily repetition and streak tracking.

## 🎯 Core Concept

Habits are recurring activities that users want to perform regularly to build positive routines:

- "Exercise 30 min" → ✅ Today ✅ Yesterday ❌ Day before → 2-day streak
- "Drink 8 glasses of water" → 5/8 glasses completed today
- "Read 20 pages" → ✅ Completed for 7 consecutive days

## 🚀 Core Features

### 1. Daily Habit Management

- **CRUD Operations**: Create, read, update, delete habits
- **Habit Types**:
  - Count-based: "Drink 8 glasses of water"
  - Time-based: "Exercise for 30 minutes"
  - Simple completion: "Take vitamins"

### 2. Daily Tracking

- **Quick completion**: Mark habits as done/undone for today
- **Progress tracking**: Visual indicators for partial completion
- **Batch operations**: Mark multiple habits complete at once

### 3. Streak & Analytics

- **Current streak**: Consecutive days of completion
- **Best streak**: Longest streak achieved
- **Weekly completion rate**: Percentage for current week
- **Monthly overview**: Calendar view of completion patterns

### 4. Habit Categories & Templates

- **Pre-built templates**: Common habits for quick setup
- **Categories**: Health, Productivity, Learning, Wellness, Custom
- **Color coding**: Visual organization and theming

### 5. Dashboard Integration

- **Mini panel**: Today's habits with quick actions
- **Progress summary**: Overall completion status
- **Streak highlights**: Current streaks and achievements

## 🏗 Technical Architecture

### Backend Models

#### Habit Model

```javascript
const habitSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ["Health", "Productivity", "Learning", "Wellness", "Custom"],
    default: "Custom",
  },
  type: {
    type: String,
    enum: ["count", "time", "simple"],
    default: "simple",
  },
  targetValue: {
    type: Number, // For count-based: 8 glasses, For time-based: 30 minutes
    default: 1,
  },
  unit: {
    type: String, // 'glasses', 'minutes', 'pages', etc.
    default: "times",
  },
  color: {
    type: String,
    default: "#6C63FF",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Extensible integration structure
  integrations: {
    type: Schema.Types.Mixed,
    default: {},
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
```

#### HabitEntry Model

```javascript
const habitEntrySchema = new Schema({
  habit: {
    type: Schema.Types.ObjectId,
    ref: "Habit",
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format for easy querying
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  currentValue: {
    type: Number, // Actual progress: 5/8 glasses, 20/30 minutes
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
  // Flexible data structure for future extensions
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for efficient queries
habitEntrySchema.index({ user: 1, date: -1 });
habitEntrySchema.index({ habit: 1, date: -1 });
```

### API Endpoints

#### Habits Management

```
GET    /api/habits              # Get user's habits
POST   /api/habits              # Create new habit
GET    /api/habits/:id          # Get specific habit
PUT    /api/habits/:id          # Update habit
DELETE /api/habits/:id          # Delete habit
GET    /api/habits/templates    # Get habit templates
```

#### Habit Entries

```
GET    /api/habits/entries                    # Get entries (with date range)
POST   /api/habits/entries                    # Log habit completion
PUT    /api/habits/entries/:habitId/:date     # Update specific entry
DELETE /api/habits/entries/:habitId/:date    # Delete specific entry
GET    /api/habits/entries/today             # Get today's entries
POST   /api/habits/entries/batch             # Batch update multiple entries
```

#### Analytics

```
GET    /api/habits/analytics/streaks/:habitId    # Get streak data for habit
GET    /api/habits/analytics/weekly             # Get weekly completion rates
GET    /api/habits/analytics/monthly            # Get monthly calendar data
GET    /api/habits/analytics/summary            # Get overall statistics
```

### Frontend Structure

```
client/src/features/Habits/
├── components/
│   ├── dashboard/
│   │   └── HabitsDashboardPanel.jsx     # Mini panel for main dashboard
│   ├── forms/
│   │   ├── HabitForm.jsx                # Create/edit habit form
│   │   └── HabitTemplateSelector.jsx    # Template selection
│   ├── tracking/
│   │   ├── HabitCard.jsx                # Individual habit display
│   │   ├── HabitProgress.jsx            # Progress indicators
│   │   └── QuickActions.jsx             # Batch completion actions
│   ├── analytics/
│   │   ├── StreakDisplay.jsx            # Streak visualization
│   │   ├── WeeklyCalendar.jsx           # 7-day progress view
│   │   └── HabitAnalytics.jsx           # Charts and statistics
│   └── ui/
│       ├── HabitIcon.jsx                # Category icons
│       └── ProgressRing.jsx             # Circular progress indicator
├── pages/
│   └── HabitsPage.jsx                   # Full-screen habits page
├── hooks/
│   ├── useHabits.js                     # Habit CRUD operations
│   ├── useHabitEntries.js               # Entry tracking operations
│   ├── useHabitAnalytics.js             # Analytics and statistics
│   └── useHabitTemplates.js             # Template management
├── services/
│   ├── habitService.js                  # API calls
│   └── habitAnalyticsService.js         # Analytics calculations
├── utils/
│   ├── habitUtils.js                    # Helper functions
│   ├── streakCalculator.js              # Streak logic
│   └── habitTemplates.js                # Default templates
└── constants/
    └── habitConstants.js                # Categories, colors, etc.
```

## 🎨 UI/UX Design

### Dashboard Panel (Mini Version)

```
┌─────────────────────────────┐
│ 🎯 Today's Habits          │
│ ─────────────────────────── │
│ ✅ Drink Water (8/8) 💧    │
│ ⭕ Exercise (0/30 min) 🏃  │
│ ✅ Read (1/1) 📚           │
│ ─────────────────────────── │
│ Progress: 2/3 (67%)        │
│ 🔥 Current Streak: 3 days  │
│ [View All Habits →]        │
└─────────────────────────────┘
```

### Full Page Layout

- **Left Panel**: Habit categories and filters
- **Center**: Habit list with progress indicators
- **Right Panel**: Analytics and streak information
- **Top Bar**: Quick actions and date navigation

## 🔧 Implementation Plan

### Phase 1: Core Foundation

1. **Backend Setup**

   - Create Habit and HabitEntry models
   - Implement basic CRUD controllers
   - Set up API routes with validation
   - Add database indexes

2. **Frontend Structure**
   - Create feature directory structure
   - Implement basic hooks for API calls
   - Set up routing for habits page

### Phase 2: Basic Tracking

1. **Habit Management**

   - Create/edit habit forms
   - Habit list display
   - Basic completion tracking

2. **Dashboard Integration**
   - Mini habits panel
   - Today's habits quick view
   - Navigation to full page

### Phase 3: Analytics & Polish

1. **Streak Calculation**

   - Implement streak logic
   - Weekly/monthly views
   - Progress visualization

2. **Templates & Categories**
   - Pre-built habit templates
   - Category organization
   - Color theming

### Phase 4: Integration Readiness

1. **Architecture Preparation**

   - Implement extensible data structures
   - Create flexible API endpoints
   - Add hook system for external integrations

2. **Documentation**
   - API documentation
   - Component documentation
   - Integration guidelines

## 🔌 Extensibility Architecture

The core feature is designed with natural extension points:

### Backend Extension Points

- **Habit Model**: `integrations` field for external feature configurations
- **HabitEntry Model**: `metadata` field for additional data from other features
- **Middleware Support**: Hook system for external processing
- **Event Emission**: Habit completion and update events

### Frontend Extension Points

- **Component Composition**: Extensible habit card and dashboard components
- **Hook System**: Custom hooks for external feature integration
- **Event Handling**: Callback props for external feature interactions
- **Context Sharing**: Shared state management for cross-feature data

### Extension Interface

```javascript
// Natural extension pattern
const useHabitExtensions = () => {
  const registerExtension = (extension) => {
    // Register external feature hooks
  };

  const getHabitActions = (habit) => {
    // Return habit-specific actions from all extensions
  };

  const calculateProgress = (habit, entries) => {
    // Allow extensions to contribute to progress calculation
  };

  return {
    registerExtension,
    getHabitActions,
    calculateProgress,
  };
};
```

This architecture allows external features to enhance habit functionality without modifying the core implementation.
