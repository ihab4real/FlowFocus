import express from "express";
import { searchAll } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Search across all user content
 *     description: Search for tasks, notes, and habits matching the query
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query term
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [all, tasks, notes, habits]
 *           default: all
 *         description: Filter results by content type
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of results per type
 *     responses:
 *       200:
 *         description: Search results from all content types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 notes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Note'
 *                 habits:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Habit'
 *       401:
 *         description: Not authorized, token missing or invalid
 *       500:
 *         description: Server error
 */
router.get("/", protect, searchAll);

export default router;
