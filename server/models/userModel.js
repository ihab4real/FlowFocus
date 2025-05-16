import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// --- Helper Functions for Hooks ---
// Moved logic from pre-save hooks to testable helper functions
async function _hashPassword(userInstance, next) {
  // Only run this function if password was modified
  if (!userInstance.isModified("password")) return next();

  try {
    // Hash the password with cost of 12
    userInstance.password = await bcrypt.hash(userInstance.password, 12);
    // Delete passwordConfirm field
    userInstance.passwordConfirm = undefined;
    next();
  } catch (error) {
    next(error); // Pass errors to Mongoose
  }
}

function _updatePasswordChangedAt(userInstance, next) {
  if (!userInstance.isModified("password") || userInstance.isNew) return next();

  // Set passwordChangedAt to current time minus 1 second
  // This ensures the token is created after the password has been changed
  userInstance.passwordChangedAt = Date.now() - 1000;
  next();
}

// --- Schema Definition ---
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide your name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (value) {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
        },
        message: "Please provide a valid email address",
      },
    },
    // OAuth provider fields
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
    providerId: {
      type: String,
      select: false,
    },
    password: {
      type: String,
      required: [
        function () {
          // Only required for local accounts
          return this.provider === "local";
        },
        "Please provide a password",
      ],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in query results by default
    },
    passwordConfirm: {
      type: String,
      required: [
        function () {
          // Only required for local accounts
          return this.provider === "local";
        },
        "Please confirm your password",
      ],
      validate: {
        // This only works on CREATE and SAVE
        validator: function (el) {
          // Only validate for local accounts or if password is being set
          return !this.password || el === this.password;
        },
        message: "Passwords do not match",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// --- Hooks ---
// Middleware to hash password before saving
userSchema.pre("save", async function (next) {
  // Call helper, passing the current document (`this`) and next
  await _hashPassword(this, next);
});

// Update passwordChangedAt property when password is changed
userSchema.pre("save", function (next) {
  // Call helper, passing the current document (`this`) and next
  _updatePasswordChangedAt(this, next);
});

// Only find active users
userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

// --- Instance Methods ---
// Instance method to check if password is correct
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if user changed password after token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    // Check if JWT timestamp is strictly less than the changed timestamp
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Token expires in 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
