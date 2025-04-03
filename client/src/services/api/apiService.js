import apiClient from "./apiClient";

export class ApiService {
  constructor(resourcePath) {
    this.resourcePath = resourcePath;
  }

  // Generic CRUD operations
  async getAll(params = {}) {
    return apiClient.get(this.resourcePath, { params });
  }

  async getById(id) {
    return apiClient.get(`${this.resourcePath}/${id}`);
  }

  async create(data) {
    return apiClient.post(this.resourcePath, data);
  }

  async update(id, data) {
    return apiClient.put(`${this.resourcePath}/${id}`, data);
  }

  async delete(id) {
    return apiClient.delete(`${this.resourcePath}/${id}`);
  }

  // Custom query methods
  async query(params) {
    return apiClient.get(`${this.resourcePath}/query`, { params });
  }

  // Batch operations
  async batchCreate(items) {
    return apiClient.post(`${this.resourcePath}/batch`, items);
  }

  async batchUpdate(items) {
    return apiClient.put(`${this.resourcePath}/batch`, items);
  }

  // Custom actions
  async executeAction(id, action, data = {}) {
    return apiClient.post(`${this.resourcePath}/${id}/${action}`, data);
  }
}

// Create service instances for different resources
export const exampleService = new ApiService("/api/examples");

// Add more service instances as needed
// export const userService = new ApiService('/api/users');
// export const projectService = new ApiService('/api/projects');
// Note: Task service is implemented in taskService.js
