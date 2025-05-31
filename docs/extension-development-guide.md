# Extension Development Guide

## Quick Start - Building Your First Extension

FlowFocus extensions let you add new features to habits without modifying core code. Here's how to build one in 5 minutes!

## Method 1: Using ExtensionBuilder (Recommended)

```javascript
import { ExtensionBuilder } from "../utils/extensionHelpers.js";
import { registerExtension } from "../services/extensionService.js";

const builder = new ExtensionBuilder("myExtension");

const myExtension = builder
  .setMetadata({
    version: "1.0.0",
    description: "My awesome extension",
    author: "Your Name",
  })

  .onHabitCreated(async (data) => {
    // Called when a habit is created
    const { habit, user } = data;
    return { myData: { initialized: true } };
  })

  .onHabitCompleted(async (data) => {
    // Called when a habit is completed
    const { habit, entry, user } = data;
    return {
      integrationUpdate: {
        "integrations.myExtension.completionCount": 1,
      },
    };
  })

  .build();

registerExtension(myExtension);
```

## Method 2: Even Simpler with createSimpleExtension

```javascript
import { createSimpleExtension } from "../utils/extensionHelpers.js";
import { registerExtension } from "../services/extensionService.js";

const myExtension = createSimpleExtension("myExtension", {
  metadata: {
    description: "Super simple extension",
  },

  onHabitCompleted: async (data) => {
    console.log("Habit completed!", data.habit.name);
    return null; // No data updates needed
  },
});

registerExtension(myExtension);
```

## Real Example: Points System

Let's build a simple points system for habits:

```javascript
import { ExtensionBuilder, extensionUtils } from "../utils/extensionHelpers.js";

const pointsExtension = new ExtensionBuilder("pointsSystem")
  .setMetadata({
    description: "Earn points for completing habits",
  })

  .withConfig({
    pointsPerCompletion: 10,
    bonusStreakPoints: 5,
  })

  .onHabitCreated(async (data) => {
    return {
      points: 0,
      totalEarned: 0,
      level: 1,
    };
  })

  .onHabitCompleted(async (data) => {
    const { habit, entry } = data;
    const dataManager = builder.getDataManager();
    const currentData = dataManager.getData(habit);

    // Calculate points
    let points = 10; // Base points

    // Bonus for streaks (you'd calculate actual streak here)
    const streakBonus = 5;
    points += streakBonus;

    const newTotal = (currentData.totalEarned || 0) + points;
    const newLevel = Math.floor(newTotal / 100) + 1;

    return {
      integrationUpdate: dataManager.updateData(currentData, {
        points: (currentData.points || 0) + points,
        totalEarned: newTotal,
        level: newLevel,
        lastEarned: {
          date: entry.date,
          points: points,
          reason: "habit_completion",
        },
      }),
    };
  })

  .addEndpoint("getPoints", async (habitId, userId) => {
    // Return user's current points
    return { points: 150, level: 2 };
  })

  .build();
```

## Available Event Hooks

- `onHabitCreated(data)` - When a habit is created
- `onHabitCompleted(data)` - When a habit is marked complete
- `onHabitUpdated(data)` - When a habit is modified
- `onHabitDeleted(data)` - When a habit is deleted

## Data Management

### Getting Extension Data from Habits

```javascript
const dataManager = builder.getDataManager();
const myData = dataManager.getData(habit); // Gets habit.integrations.myExtension
```

### Updating Extension Data

```javascript
return {
  integrationUpdate: dataManager.updateData(currentData, {
    newField: "newValue",
    count: oldCount + 1,
  }),
};
```

## Validation (Optional)

```javascript
import { SimpleValidator, validators } from "../utils/extensionHelpers.js";

const validator = new SimpleValidator();
validator.addRule("mood", validators.range(1, 10), "Mood must be 1-10");
validator.addRule("note", validators.maxLength(100), "Note too long");

const result = validator.validate({ mood: 8, note: "Great day!" });
if (!result.isValid) {
  console.log("Errors:", result.errors);
}
```

## Utility Functions

```javascript
import { extensionUtils } from "../utils/extensionHelpers.js";

// Get today's date
const today = extensionUtils.getTodayDate(); // "2024-01-15"

// Check if date is today
const isToday = extensionUtils.isToday(someDate);

// Calculate days between dates
const daysDiff = extensionUtils.daysBetween("2024-01-01", "2024-01-15"); // 14
```

## Adding Your Extension to the System

1. Create your extension file in `server/extensions/examples/`
2. Add initialization to `server/extensions/initializeExtensions.js`:

```javascript
try {
  const { initializeMyExtension } = await import("./examples/myExtension.js");
  initializeMyExtension();
  extensionsLoaded.push("myExtension");
} catch (error) {
  logWarn("Failed to load My Extension", { error: error.message });
  extensionsFailed.push("myExtension");
}
```

## Extension Data Storage

Extension data is stored in the habit's `integrations` field:

```javascript
// Habit object structure
{
  name: "Exercise",
  type: "simple",
  // ... other habit fields
  integrations: {
    myExtension: {
      // Your extension data goes here
      points: 50,
      level: 2,
      createdAt: "2024-01-01T00:00:00Z",
      lastUpdated: "2024-01-15T12:00:00Z"
    },
    anotherExtension: {
      // Another extension's data
    }
  }
}
```

## Best Practices

1. **Keep it simple** - Don't over-engineer
2. **Handle errors gracefully** - Extensions shouldn't crash the main app
3. **Use descriptive names** - Make your extension purpose clear
4. **Validate data** - Check inputs to prevent bad data
5. **Log important events** - Help with debugging

## Common Patterns

### Counter Extension

```javascript
onHabitCompleted: async (data) => {
  const current = dataManager.getData(data.habit);
  return {
    integrationUpdate: dataManager.updateData(current, {
      count: (current.count || 0) + 1,
    }),
  };
};
```

### Timestamp Tracker

```javascript
onHabitCompleted: async (data) => {
  return {
    integrationUpdate: {
      "integrations.myExtension.lastCompleted": new Date(),
      "integrations.myExtension.completionTimes": Date.now(),
    },
  };
};
```

### Conditional Logic

```javascript
onHabitCompleted: async (data) => {
  const { habit, entry } = data;

  // Only track certain habit types
  if (habit.type !== "count") {
    return null; // No updates
  }

  // Only on weekends
  const isWeekend = new Date().getDay() % 6 === 0;
  if (!isWeekend) {
    return null;
  }

  // Your logic here...
};
```

That's it! You now know how to build FlowFocus extensions. Start simple and build up from there!
