import PomodoroSettings from "../models/pomodoroSettingsModel.js";
import PomodoroSession from "../models/pomodoroSessionModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * Get or create user's pomodoro settings
 * @route GET /api/pomodoro/settings
 */
export const getOrCreateSettings = asyncHandler(async (req, res) => {
  let settings = await PomodoroSettings.findOne({ user: req.user.id });

  if (!settings) {
    settings = await PomodoroSettings.create({
      user: req.user.id,
      // Default values will be set by the model
    });
    logInfo(`Created default pomodoro settings for user ${req.user.id}`);
  }

  res.status(200).json({
    status: "success",
    data: {
      settings,
    },
  });
});

/**
 * Update user's pomodoro settings
 * @route PUT /api/pomodoro/settings
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await PomodoroSettings.findOneAndUpdate(
    { user: req.user.id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!settings) {
    throw errorTypes.notFound("No settings found for this user");
  }

  res.status(200).json({
    status: "success",
    data: {
      settings,
    },
  });
});

/**
 * Create a new pomodoro session
 * @route POST /api/pomodoro/sessions
 */
export const createSession = asyncHandler(async (req, res) => {
  const { startTime, endTime, type, category, tags, notes, interruptions } =
    req.body;

  // Calculate duration in minutes
  const duration = Math.round(
    (new Date(endTime) - new Date(startTime)) / (1000 * 60)
  );

  // Calculate productivity score based on interruptions and duration
  const productivityScore = calculateProductivityScore(duration, interruptions);

  const session = await PomodoroSession.create({
    user: req.user.id,
    startTime,
    endTime,
    duration,
    type,
    category,
    tags,
    notes,
    interruptions,
    productivityScore,
  });

  res.status(201).json({
    status: "success",
    data: {
      session,
    },
  });
});

/**
 * Get user's pomodoro sessions with optional filters
 * @route GET /api/pomodoro/sessions
 */
export const getSessions = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, category, tags } = req.query;

  const query = { user: req.user.id };

  if (startDate && endDate) {
    query.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  if (type) query.type = type;
  if (category) query.category = category;
  if (tags) query.tags = { $in: tags.split(",") };

  const sessions = await PomodoroSession.find(query).sort({ startTime: -1 });

  res.status(200).json({
    status: "success",
    results: sessions.length,
    data: {
      sessions,
    },
  });
});

/**
 * Update a pomodoro session
 * @route PATCH /api/pomodoro/sessions/:id
 */
export const updateSession = asyncHandler(async (req, res) => {
  const session = await PomodoroSession.findById(req.params.id);

  if (!session) {
    throw errorTypes.notFound("No session found with that ID");
  }

  // Check if the session belongs to the user
  if (session.user.toString() !== req.user.id) {
    throw errorTypes.forbidden(
      "You do not have permission to update this session"
    );
  }

  // If duration-related fields are updated, recalculate productivity score
  if (req.body.endTime || req.body.interruptions) {
    const duration = req.body.endTime
      ? Math.round(
          (new Date(req.body.endTime) - new Date(session.startTime)) /
            (1000 * 60)
        )
      : session.duration;
    const interruptions = req.body.interruptions ?? session.interruptions;
    req.body.productivityScore = calculateProductivityScore(
      duration,
      interruptions
    );
    if (req.body.endTime) req.body.duration = duration;
  }

  const updatedSession = await PomodoroSession.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      session: updatedSession,
    },
  });
});

/**
 * Delete a pomodoro session
 * @route DELETE /api/pomodoro/sessions/:id
 */
export const deleteSession = asyncHandler(async (req, res) => {
  const session = await PomodoroSession.findById(req.params.id);

  if (!session) {
    throw errorTypes.notFound("No session found with that ID");
  }

  // Check if the session belongs to the user
  if (session.user.toString() !== req.user.id) {
    throw errorTypes.forbidden(
      "You do not have permission to delete this session"
    );
  }

  await session.deleteOne();

  res.status(204).json({
    status: "success",
    data: null,
  });
});

/**
 * Get enhanced session statistics
 * @route GET /api/pomodoro/sessions/stats
 */
export const getSessionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = "day" } = req.query;

  const matchStage = { user: req.user.id };
  if (startDate && endDate) {
    matchStage.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // Group by time period based on the groupBy parameter
  let groupStage = {};
  switch (groupBy) {
    case "day":
      groupStage = {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$startTime",
        },
      };
      break;
    case "week":
      groupStage = {
        $dateToString: {
          format: "%Y-%W",
          date: "$startTime",
        },
      };
      break;
    case "month":
      groupStage = {
        $dateToString: {
          format: "%Y-%m",
          date: "$startTime",
        },
      };
      break;
    default:
      groupStage = null;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: groupStage,
        totalSessions: { $sum: 1 },
        totalFocusTime: { $sum: "$duration" },
        completedSessions: {
          $sum: { $cond: ["$completed", 1, 0] },
        },
        avgProductivityScore: { $avg: "$productivityScore" },
        totalInterruptions: { $sum: "$interruptions" },
        sessionsByType: {
          $push: {
            type: "$type",
            duration: "$duration",
          },
        },
        // Add trend data
        dailyFocusTime: {
          $push: {
            date: "$startTime",
            duration: "$duration",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ];

  const stats = await PomodoroSession.aggregate(pipeline);

  res.status(200).json({
    status: "success",
    data: {
      stats: stats[0] || {
        totalSessions: 0,
        totalFocusTime: 0,
        completedSessions: 0,
        avgProductivityScore: 0,
        totalInterruptions: 0,
        sessionsByType: [],
        dailyFocusTime: [],
      },
    },
  });
});

// Helper function to calculate productivity score
const calculateProductivityScore = (duration, interruptions) => {
  // Base score is 100
  let score = 100;

  // Deduct points for interruptions
  const interruptionPenalty = interruptions * 5;
  score -= interruptionPenalty;

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score));
};
