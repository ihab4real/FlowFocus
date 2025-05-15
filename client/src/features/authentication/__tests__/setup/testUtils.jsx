import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { jest } from "@jest/globals";

// Utility for rendering components with the Router context
export function renderWithRouter(ui, { route = "/" } = {}) {
  window.history.pushState({}, "Test page", route);

  return render(ui, { wrapper: BrowserRouter });
}

// Mock implementation of apiClient for tests
export const mockApiClient = {
  post: jest.fn(),
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

// Utility to create mock success response
export const createSuccessResponse = (data) => ({
  data,
  token: "mock-token",
  status: "success",
  ok: true,
});

// Utility to create mock error response
export const createErrorResponse = (message) => {
  const error = new Error(message);
  error.response = {
    data: { message, status: "fail" },
    status: 400,
  };
  return error;
};
