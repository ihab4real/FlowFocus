import express from "express";
import {
  getOrCreateSettings,
  updateSettings,
  createSession,
  getSessions,
  updateSession,
  deleteSession,
  getSessionStats,
} from "../controllers/pomodoroController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/pomodoro/settings:
 *   get:
 *     summary: Get or create user's pomodoro settings
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved or created settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     settings:
 *                       $ref: '#/components/schemas/PomodoroSettings'
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/pomodoro/settings:
 *   put:
 *     summary: Update user's pomodoro settings
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PomodoroSettings'
 *     responses:
 *       200:
 *         description: Successfully updated settings
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Settings not found
 */
router.route("/settings").get(getOrCreateSettings).put(updateSettings);

/**
 * @swagger
 * /api/pomodoro/sessions:
 *   post:
 *     summary: Create a new pomodoro session
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PomodoroSession'
 *     responses:
 *       201:
 *         description: Successfully created session
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/pomodoro/sessions:
 *   get:
 *     summary: Get user's pomodoro sessions with optional filters
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering sessions
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering sessions
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [focus, shortBreak, longBreak]
 *         description: Filter by session type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated list of tags to filter by
 *     responses:
 *       200:
 *         description: Successfully retrieved sessions
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/sessions").post(createSession).get(getSessions);

/**
 * @swagger
 * /api/pomodoro/sessions/{id}:
 *   patch:
 *     summary: Update a pomodoro session
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PomodoroSession'
 *     responses:
 *       200:
 *         description: Successfully updated session
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not the owner of the session
 *       404:
 *         description: Session not found
 */
/**
 * @swagger
 * /api/pomodoro/sessions/{id}:
 *   delete:
 *     summary: Delete a pomodoro session
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Session ID
 *     responses:
 *       204:
 *         description: Successfully deleted session
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Not the owner of the session
 *       404:
 *         description: Session not found
 */
router.route("/sessions/:id").patch(updateSession).delete(deleteSession);

/**
 * @swagger
 * /api/pomodoro/sessions/stats:
 *   get:
 *     summary: Get session statistics
 *     tags: [Pomodoro]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, week, month]
 *           default: day
 *         description: Group statistics by time period
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: number
 *                         totalFocusTime:
 *                           type: number
 *                         completedSessions:
 *                           type: number
 *                         avgProductivityScore:
 *                           type: number
 *                         totalInterruptions:
 *                           type: number
 *                         sessionsByType:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               type:
 *                                 type: string
 *                               duration:
 *                                 type: number
 *                         dailyFocusTime:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               date:
 *                                 type: string
 *                                 format: date-time
 *                               duration:
 *                                 type: number
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.get("/sessions/stats", getSessionStats);

export default router;
