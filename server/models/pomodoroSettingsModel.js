import mongoose from "mongoose";

const pomodoroSettingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    focusDuration: {
      type: Number,
      default: 25,
      min: 1,
      max: 120,
    },
    shortBreakDuration: {
      type: Number,
      default: 5,
      min: 1,
      max: 30,
    },
    longBreakDuration: {
      type: Number,
      default: 15,
      min: 5,
      max: 60,
    },
    longBreakInterval: {
      type: Number,
      default: 4,
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
      default: 80,
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
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field before saving
pomodoroSettingsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const PomodoroSettings = mongoose.model(
  "PomodoroSettings",
  pomodoroSettingsSchema
);

export default PomodoroSettings;
