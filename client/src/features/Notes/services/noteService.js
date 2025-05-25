import { ApiService } from "@/services/api/apiService";
import apiClient from "@/services/api/apiClient";

/**
 * Note service for handling note-related API requests
 */
const noteService = new ApiService("/api/notes");

/**
 * Get all notes with optional filtering
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Response with notes data
 */
noteService.getNotes = async (filters = {}) => {
  return apiClient.get(noteService.resourcePath, { params: filters });
};

/**
 * Get a single note by ID
 * @param {string} id - Note ID
 * @returns {Promise<Object>} - Response with note data
 */
noteService.getById = async (id) => {
  return apiClient.get(`${noteService.resourcePath}/${id}`);
};

/**
 * Create a new note
 * @param {Object} data - Note data
 * @returns {Promise<Object>} - Response with created note data
 */
noteService.create = async (data) => {
  return apiClient.post(noteService.resourcePath, data);
};

/**
 * Update a note
 * @param {string} id - Note ID
 * @param {Object} data - Updated note data
 * @returns {Promise<Object>} - Response with updated note data
 */
noteService.update = async (id, data) => {
  return apiClient.patch(`${noteService.resourcePath}/${id}`, data);
};

/**
 * Delete a note
 * @param {string} id - Note ID
 * @returns {Promise<Object>} - Response with success message
 */
noteService.delete = async (id) => {
  return apiClient.delete(`${noteService.resourcePath}/${id}`);
};

/**
 * Get all folders for the current user
 * @returns {Promise<Object>} - Response with folders data
 */
noteService.getFolders = async () => {
  return apiClient.get(`${noteService.resourcePath}/folders`);
};

/**
 * Create a new folder
 * @param {string} name - Folder name
 * @returns {Promise<Object>} - Response with created folder data
 */
noteService.createFolder = async (name) => {
  return apiClient.post(`${noteService.resourcePath}/folders`, { name });
};

/**
 * Delete a folder
 * @param {string} name - Folder name
 * @returns {Promise<Object>} - Response with success message
 */
noteService.deleteFolder = async (name) => {
  return apiClient.delete(`${noteService.resourcePath}/folders/${name}`);
};

/**
 * Rename a folder
 * @param {string} oldName - Current folder name
 * @param {string} newName - New folder name
 * @returns {Promise<Object>} - Response with success message
 */
noteService.renameFolder = async (oldName, newName) => {
  return apiClient.patch(`${noteService.resourcePath}/folders/${oldName}`, {
    name: newName,
  });
};

export default noteService;
