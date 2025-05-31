import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  registerHabitExtension,
  unregisterHabitExtension,
  getHabitExtensions,
  getHabitExtension,
  updateExtensionStatus,
  getHabitIntegrationActions,
  getHabitIntegrationAnalytics,
  updateHabitIntegration,
  getHabitIntegration,
  deleteHabitIntegration,
  batchUpdateIntegrations,
  getExtensionStats,
} from "../controllers/habitIntegrationController.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/habits/integrations/extensions:
 *   get:
 *     summary: Get all registered habit extensions
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: habitType
 *         schema:
 *           type: string
 *           enum: [time, count, simple]
 *         description: Filter extensions by supported habit type
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Return only active extensions
 *     responses:
 *       200:
 *         description: Successfully retrieved extensions
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/habits/integrations/extensions:
 *   post:
 *     summary: Register a new habit extension
 *     tags: [Habit Integrations]
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
 *               - version
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               version:
 *                 type: string
 *               description:
 *                 type: string
 *               supportedHabitTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [time, count, simple, all]
 *     responses:
 *       201:
 *         description: Extension registered successfully
 *       400:
 *         description: Registration failed
 *       401:
 *         description: Unauthorized - Authentication required
 */
router
  .route("/extensions")
  .get(getHabitExtensions)
  .post(registerHabitExtension);

/**
 * @swagger
 * /api/habits/integrations/batch:
 *   post:
 *     summary: Batch update multiple habit integrations
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - updates
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - habitId
 *                     - extensionName
 *                     - data
 *                   properties:
 *                     habitId:
 *                       type: string
 *                     extensionName:
 *                       type: string
 *                     data:
 *                       type: object
 *     responses:
 *       200:
 *         description: Batch updates processed
 *       400:
 *         description: Invalid updates array
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/batch").post(batchUpdateIntegrations);

/**
 * @swagger
 * /api/habits/integrations/stats:
 *   get:
 *     summary: Get extension registry statistics
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved registry statistics
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/stats").get(getExtensionStats);

/**
 * @swagger
 * /api/habits/integrations/extensions/{name}:
 *   get:
 *     summary: Get specific extension details
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Extension name
 *     responses:
 *       200:
 *         description: Successfully retrieved extension
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Extension not found
 */
/**
 * @swagger
 * /api/habits/integrations/extensions/{name}:
 *   delete:
 *     summary: Unregister an extension
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Extension name
 *     responses:
 *       200:
 *         description: Extension unregistered successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Extension not found
 */
router
  .route("/extensions/:name")
  .get(getHabitExtension)
  .delete(unregisterHabitExtension);

/**
 * @swagger
 * /api/habits/integrations/extensions/{name}/status:
 *   patch:
 *     summary: Enable or disable an extension
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Extension name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Extension status updated successfully
 *       400:
 *         description: Invalid isActive value
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Extension not found
 */
router.route("/extensions/:name/status").patch(updateExtensionStatus);

/**
 * @swagger
 * /api/habits/{habitId}/integrations/actions:
 *   get:
 *     summary: Get available integration actions for a specific habit
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: habitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *     responses:
 *       200:
 *         description: Successfully retrieved available actions
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
router.route("/:habitId/actions").get(getHabitIntegrationActions);

/**
 * @swagger
 * /api/habits/{habitId}/integrations/analytics:
 *   get:
 *     summary: Get extension analytics for a specific habit
 *     tags: [Habit Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: habitId
 *         required: true
 *         schema:
 *           type: string
 *         description: Habit ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Successfully retrieved extension analytics
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
router.route("/:habitId/analytics").get(getHabitIntegrationAnalytics);

/**
 * @swagger
 * /api/habits/{habitId}/integrations/{extensionName}:
 *   get:
 *     summary: Get habit integration data for a specific extension
 *     tags: [Habit Integrations]
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
 *         name: extensionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Extension name
 *     responses:
 *       200:
 *         description: Successfully retrieved integration data
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
/**
 * @swagger
 * /api/habits/{habitId}/integrations/{extensionName}:
 *   put:
 *     summary: Update habit integration data for a specific extension
 *     tags: [Habit Integrations]
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
 *         name: extensionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Extension name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Extension-specific integration data
 *     responses:
 *       200:
 *         description: Integration data updated successfully
 *       400:
 *         description: Extension not active or validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
/**
 * @swagger
 * /api/habits/{habitId}/integrations/{extensionName}:
 *   delete:
 *     summary: Delete habit integration data for a specific extension
 *     tags: [Habit Integrations]
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
 *         name: extensionName
 *         required: true
 *         schema:
 *           type: string
 *         description: Extension name
 *     responses:
 *       200:
 *         description: Integration data removed successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Habit not found
 */
router
  .route("/:habitId/:extensionName")
  .get(getHabitIntegration)
  .put(updateHabitIntegration)
  .delete(deleteHabitIntegration);

export default router;
