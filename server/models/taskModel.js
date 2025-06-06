import mongoose from "mongoose";
const { Schema } = mongoose;

const taskSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Todo", "Doing", "Done"],
    default: "Todo",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  dueDate: {
    type: Date,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
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
taskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for more efficient search
taskSchema.index({ title: "text", description: "text", tags: "text" });
taskSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("Task", taskSchema);
