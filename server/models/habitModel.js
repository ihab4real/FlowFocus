import mongoose from "mongoose";
const { Schema } = mongoose;

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
    default: "#6C63FF", // FlowFocus primary color
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // Extensible integration structure for future features
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

// Update the updatedAt timestamp before saving
habitSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
habitSchema.index({ user: 1, isActive: 1 });
habitSchema.index({ user: 1, category: 1 });

export default mongoose.model("Habit", habitSchema);
