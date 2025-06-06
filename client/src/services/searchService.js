import apiClient from "./api/apiClient";

/**
 * Search across tasks, notes, and habits
 * @param {string} query - The search term
 * @param {Object} options - Search options
 * @param {string} options.type - Filter by type: 'all', 'tasks', 'notes', 'habits'
 * @param {number} options.limit - Number of results to return per type
 * @returns {Promise<{tasks: Array, notes: Array, habits: Array}>} Search results
 */
export const globalSearch = async (query, options = {}) => {
  const { type = "all", limit = 20 } = options;

  try {
    const response = await apiClient.get("/api/search", {
      params: {
        q: query,
        type,
        limit,
      },
    });

    return response;
  } catch (error) {
    console.error("Search error:", error);
    throw error;
  }
};
