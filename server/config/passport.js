import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import crypto from "crypto";
import User from "../models/userModel.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * Configure Passport strategies for OAuth authentication
 */
export const configurePassport = () => {
  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL}/api/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await User.findOne({
            providerId: profile.id,
            provider: "google",
          });

          if (user) {
            // User exists, return the user
            return done(null, user);
          }

          // Check if user exists with the same email
          const email =
            profile.emails && profile.emails[0] ? profile.emails[0].value : "";
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Update existing user with Google provider info
              user.providerId = profile.id;
              user.provider = "google";
              await user.save({ validateBeforeSave: false });
              logInfo("User linked Google account", { userId: user._id });
              return done(null, user);
            }
          }

          // Generate the same random password for both fields
          const randomPassword = crypto.randomBytes(16).toString("hex");

          // Create new user
          const newUser = await User.create({
            name:
              profile.displayName ||
              (profile.name
                ? `${profile.name.givenName} ${profile.name.familyName}`
                : "Google User"),
            email: email,
            providerId: profile.id,
            provider: "google",
            password: randomPassword,
            passwordConfirm: randomPassword,
          });

          logInfo("New user registered via Google OAuth", {
            userId: newUser._id,
          });
          return done(null, newUser);
        } catch (error) {
          logError("Error in Google authentication strategy", {
            error: error.message,
          });
          return done(error);
        }
      }
    )
  );

  // GitHub Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL}/api/auth/github/callback`,
        scope: ["user:email"], // Request email scope from GitHub
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this GitHub ID
          let user = await User.findOne({
            providerId: profile.id,
            provider: "github",
          });

          if (user) {
            // User exists, return the user
            return done(null, user);
          }

          // Get the email from GitHub (may be in the profile or need to fetch separately)
          const email =
            profile.emails && profile.emails[0] ? profile.emails[0].value : "";

          if (email) {
            // Check if user exists with the same email
            user = await User.findOne({ email });

            if (user) {
              // Update existing user with GitHub provider info
              user.providerId = profile.id;
              user.provider = "github";
              await user.save({ validateBeforeSave: false });
              logInfo("User linked GitHub account", { userId: user._id });
              return done(null, user);
            }
          }

          // Generate the same random password for both fields
          const randomPassword = crypto.randomBytes(16).toString("hex");

          // Create new user
          const newUser = await User.create({
            name: profile.displayName || profile.username || "GitHub User",
            email: email,
            providerId: profile.id,
            provider: "github",
            password: randomPassword,
            passwordConfirm: randomPassword,
          });

          logInfo("New user registered via GitHub OAuth", {
            userId: newUser._id,
          });
          return done(null, newUser);
        } catch (error) {
          logError("Error in GitHub authentication strategy", {
            error: error.message,
          });
          return done(error);
        }
      }
    )
  );

  return passport;
};
