import mongoose from "mongoose";
const { Schema } = mongoose;

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

// Update the updatedAt timestamp before saving
habitEntrySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound indexes for efficient queries
habitEntrySchema.index({ user: 1, date: -1 });
habitEntrySchema.index({ habit: 1, date: -1 });
habitEntrySchema.index({ user: 1, habit: 1, date: 1 }, { unique: true }); // Prevent duplicate entries

export default mongoose.model("HabitEntry", habitEntrySchema);
