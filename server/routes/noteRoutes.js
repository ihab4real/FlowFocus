import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sanitizeBody } from "../middleware/sanitizationMiddleware.js";
import {
  getAllNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
  getFolders,
  createFolder
} from "../controllers/noteController.js";

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved notes
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: The note title
 *               content:
 *                 type: string
 *                 description: The note content (HTML or plain text)
 *               folder:
 *                 type: string
 *                 description: The folder name
 *                 default: General
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tags for the note
 *     responses:
 *       201:
 *         description: Note created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/")
  .get(getAllNotes)
  .post(sanitizeBody(['content']), createNote);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Successfully retrieved note
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Note belongs to another user
 *       404:
 *         description: Note not found
 */
/**
 * @swagger
 * /api/notes/{id}:
 *   patch:
 *     summary: Update a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               folder:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Note belongs to another user
 *       404:
 *         description: Note not found
 */
/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       204:
 *         description: Note deleted successfully
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Note belongs to another user
 *       404:
 *         description: Note not found
 */
router.route("/:id")
  .get(getNote)
  .patch(sanitizeBody(['content']), updateNote)
  .delete(deleteNote);

/**
 * @swagger
 * /api/notes/folders:
 *   get:
 *     summary: Get all folders for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved folders
 *       401:
 *         description: Unauthorized - Authentication required
 */
/**
 * @swagger
 * /api/notes/folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Notes]
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
 *                 description: The folder name
 *     responses:
 *       201:
 *         description: Folder created successfully
 *       400:
 *         description: Validation error or folder already exists
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.route("/folders").get(getFolders).post(createFolder);

export default router; 