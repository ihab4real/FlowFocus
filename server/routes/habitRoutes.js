import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createHabit,
  getHabits,
  getHabit,
  updateHabit,
  deleteHabit,
  getEntries,
  getTodayEntries,
  logEntry,
  updateEntry,
  deleteEntry,
  batchUpdateEntries,
} from "../controllers/habitController.js";
import {
  validateCreateHabit,
  validateUpdateHabit,
  validateHabitEntry,
  validateBatchEntries,
} from "../middleware/habitValidation.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/habits:
 *   get:
 *     summary: Get all habits for the authenticated user
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Health, Productivity, Learning, Wellness, Custom]
 *         description: Filter habits by category
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active/inactive habits
 *     responses:
 *       200:
 *         description: Successfully retrieved habits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habit'
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/habits:
 *   post:
 *     summary: Create a new habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The habit name
 *               description:
 *                 type: string
 *                 description: The habit description
 *               category:
 *                 type: string
 *                 enum: [Health, Productivity, Learning, Wellness, Custom]
 *                 default: Custom
 *               type:
 *                 type: string
 *                 enum: [count, time, simple]
 *                 default: simple
 *               targetValue:
 *                 type: number
 *                 default: 1
 *               unit:
 *                 type: string
 *                 default: times
 *               color:
 *                 type: string
 *                 default: "#6C63FF"
 *     responses:
 *       201:
 *         description: Habit created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Habit'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/").get(getHabits).post(validateCreateHabit, createHabit);

/**
 * @swagger
 * /api/habits/entries:
 *   get:
 *     summary: Get habit entries with optional filtering
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: habitId
 *         schema:
 *           type: string
 *         description: Filter by specific habit ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successfully retrieved habit entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HabitEntry'
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/habits/entries:
 *   post:
 *     summary: Log habit completion
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - habitId
 *               - date
 *             properties:
 *               habitId:
 *                 type: string
 *                 description: The habit ID
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date in YYYY-MM-DD format
 *               currentValue:
 *                 type: number
 *                 default: 0
 *               completed:
 *                 type: boolean
 *                 default: false
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Habit entry logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/HabitEntry'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
router.route("/entries").get(getEntries).post(validateHabitEntry, logEntry);

/**
 * @swagger
 * /api/habits/entries/today:
 *   get:
 *     summary: Get today's habit entries
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved today's entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HabitEntry'
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/entries/today").get(getTodayEntries);

/**
 * @swagger
 * /api/habits/entries/batch:
 *   post:
 *     summary: Batch update multiple habit entries
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entries
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - habitId
 *                     - date
 *                   properties:
 *                     habitId:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *                     currentValue:
 *                       type: number
 *                     completed:
 *                       type: boolean
 *                     notes:
 *                       type: string
 *     responses:
 *       200:
 *         description: Entries updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/HabitEntry'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/entries/batch").post(validateBatchEntries, batchUpdateEntries);

/**
 * @swagger
 * /api/habits/entries/{habitId}/{date}:
 *   put:
 *     summary: Update a specific habit entry
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: habitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentValue:
 *                 type: number
 *               completed:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Entry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/HabitEntry'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Entry not found
 */
/**
 * @swagger
 * /api/habits/entries/{habitId}/{date}:
 *   delete:
 *     summary: Delete a specific habit entry
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: habitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *       - in: path
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Date in YYYY-MM-DD format
 *     responses:
 *       204:
 *         description: Entry deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Entry not found
 */
router.route("/entries/:habitId/:date").put(updateEntry).delete(deleteEntry);

/**
 * @swagger
 * /api/habits/{id}:
 *   get:
 *     summary: Get a habit by ID
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Successfully retrieved habit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Habit'
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
/**
 * @swagger
 * /api/habits/{id}:
 *   put:
 *     summary: Update a habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Health, Productivity, Learning, Wellness, Custom]
 *               type:
 *                 type: string
 *                 enum: [count, time, simple]
 *               targetValue:
 *                 type: number
 *               unit:
 *                 type: string
 *               color:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Habit updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Habit'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
/**
 * @swagger
 * /api/habits/{id}:
 *   delete:
 *     summary: Delete a habit
 *     tags: [Habits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     responses:
 *       204:
 *         description: Habit deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
router
  .route("/:id")
  .get(getHabit)
  .put(validateUpdateHabit, updateHabit)
  .delete(deleteHabit);

export default router;
