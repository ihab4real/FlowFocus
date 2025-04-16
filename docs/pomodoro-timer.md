# Pomodoro Timer Implementation Guide

## Overview

This document outlines the implementation plan for FlowFocus's pomodoro timer system, featuring a customizable timer with visual indicators, sound notifications, and session tracking functionality.

## Data Model

### PomodoroSettings Schema (For server-side persistence - Phase 3)

```javascript
const pomodoroSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  focusDuration: {
    type: Number,
    default: 25, // minutes
    min: 1,
    max: 120,
  },
  shortBreakDuration: {
    type: Number,
    default: 5, // minutes
    min: 1,
    max: 30,
  },
  longBreakDuration: {
    type: Number,
    default: 15, // minutes
    min: 5,
    max: 60,
  },
  longBreakInterval: {
    type: Number,
    default: 4, // sessions
    min: 2,
    max: 10,
  },
  autoStartBreaks: {
    type: Boolean,
    default: true,
  },
  autoStartPomodoros: {
    type: Boolean,
    default: false,
  },
  soundEnabled: {
    type: Boolean,
    default: true,
  },
  soundVolume: {
    type: Number,
    default: 80, // percentage
    min: 0,
    max: 100,
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

### PomodoroSession Schema (For analytics - Future phase)

```javascript
const pomodoroSessionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // actual duration in minutes
  },
  completed: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ["focus", "shortBreak", "longBreak"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
```

## Client-Side Implementation

### Component Hierarchy

```
PomodoroContainer/
├── PomodoroTimer/
│   ├── TimerDisplay
│   ├── ProgressCircle
│   ├── TimerControls
│   └── SessionCounter
├── PomodoroSettingsModal/
│   ├── DurationInputs
│   ├── AutoStartOptions
│   └── SoundSettings
└── FullScreenPomodoro/ (For focus mode)
    ├── PomodoroTimer
    └── FullscreenControls
```

### UI Specifications

#### TimerDisplay

- Large, readable font
- Minutes:Seconds format
- Color changes based on mode (focus/break)
- Pulsing animation during last 10 seconds

#### ProgressCircle

- Circular progress indicator around the timer
- Different colors for focus (primary purple) and break (teal)
- Smooth animations for transitions

#### TimerControls

- Start/Pause button
- Reset button
- Skip button (to next session)
- Settings button

#### SessionCounter

- Visual indication of completed sessions
- Highlight current session
- Different visual for long breaks

## Implementation Phases

### Phase 1: Basic Timer (MVP)

#### Client Tasks

1. Create basic timer logic with useState/useEffect
2. Implement start/pause/reset controls
3. Add circular progress indicator
4. Implement mode switching (focus/break)
5. Build clean UI with proper styling
6. Add basic fullscreen mode

### Phase 2: Enhanced Features

#### Client Tasks

1. Add long break logic after 4 focus sessions
2. Implement session counter with visual indicators
3. Add sound notifications for session changes
4. Add toast notifications for session completion
5. Implement skip to next session functionality
6. Add keyboard shortcuts for common actions
7. Enhance fullscreen mode with animations

### Phase 3: Settings & Persistence

#### Client Tasks

1. Build settings modal with appropriate UI components
2. Add duration customization for all session types
3. Implement auto-start toggles
4. Add sound settings (volume, on/off)
5. Persist settings to localStorage
6. Add theme integration
7. Implement session statistics (optional)

#### Server Tasks (Future)

1. Create API endpoints for saving user preferences
2. Implement session tracking for analytics
3. Create visualization for productivity patterns

## Technical Dependencies

### Client

- Existing React ecosystem
- Existing UI components
- `use-sound` library for sound effects (optional)
- `tailwindcss` for styling
- `lucide-react` for icons

### Server (Future Phase)

- Existing Express.js backend
- MongoDB for data storage

## Keyboard Shortcuts

| Key   | Action               |
| ----- | -------------------- |
| Space | Start/Pause timer    |
| Esc   | Exit fullscreen      |
| R     | Reset current timer  |
| S     | Skip to next session |
| F     | Enter fullscreen     |

## Sound Notifications

- Session start: Soft bell sound
- Session end: Completion chime
- Break end: Alert sound
- Last 10 seconds: Tick sound (optional)

## Security & Performance Considerations

1. Store user preferences securely
2. Optimize timer accuracy
3. Handle background tab behavior appropriately
4. Ensure smooth animations even on lower-end devices
5. Use lazy loading for sound assets
