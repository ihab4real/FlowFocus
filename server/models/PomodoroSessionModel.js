import mongoose from "mongoose";

const pomodoroSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
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
  category: {
    type: String,
    trim: true,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  notes: {
    type: String,
    trim: true,
  },
  productivityScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  interruptions: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better query performance
pomodoroSessionSchema.index({ user: 1, startTime: -1 });
pomodoroSessionSchema.index({ user: 1, type: 1 });
pomodoroSessionSchema.index({ user: 1, category: 1 });
pomodoroSessionSchema.index({ user: 1, tags: 1 });

const PomodoroSession = mongoose.model(
  "PomodoroSession",
  pomodoroSessionSchema
);

export default PomodoroSession;
