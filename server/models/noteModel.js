import mongoose from "mongoose";
const { Schema } = mongoose;

const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    default: "",
  },
  folder: {
    type: String,
    default: "General",
    trim: true,
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
noteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt timestamp before updating
noteSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Add indexes for more efficient search
noteSchema.index({ title: "text", content: "text", tags: "text" });
noteSchema.index({ user: 1, updatedAt: -1 });
noteSchema.index({ user: 1, folder: 1 });

export default mongoose.model("Note", noteSchema);
