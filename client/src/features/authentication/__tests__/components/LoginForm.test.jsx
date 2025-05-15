import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "../../components/LoginForm";
import { useAuthStore } from "../../store/authStore";

// Mock the auth store
jest.mock("../../store/authStore", () => ({
  useAuthStore: jest.fn(),
}));

// Helper function to render LoginForm with Router
const renderLoginForm = (onSuccess = jest.fn()) => {
  return render(
    <BrowserRouter>
      <LoginForm onSuccess={onSuccess} />
    </BrowserRouter>
  );
};

describe("LoginForm Component", () => {
  // Mock login function
  const mockLogin = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementation
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      setError: mockSetError,
    });

    // Default success response
    mockLogin.mockResolvedValue({ success: true });
  });

  it("should render all form elements correctly", () => {
    // Act
    renderLoginForm();

    // Assert
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign up/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /forgot password/i })
    ).toBeInTheDocument();
  });

  it("should call login function with form data on submit", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCredentials = {
      email: "test@example.com",
      password: "password123",
    };
    renderLoginForm();

    // Act
    await user.type(screen.getByLabelText(/email/i), mockCredentials.email);
    await user.type(
      screen.getByLabelText(/password/i),
      mockCredentials.password
    );
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Assert
    expect(mockLogin).toHaveBeenCalledWith(mockCredentials);
  });

  it("should show loading state during form submission", async () => {
    // Arrange
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      setError: mockSetError,
    });
    const user = userEvent.setup();
    renderLoginForm();

    // Act
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");

    // Assert
    const submitButton = screen.getByRole("button", { name: /signing in/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("should call onSuccess callback when login succeeds", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    renderLoginForm(onSuccessMock);

    // Act
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Assert
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it("should not call onSuccess callback when login fails", async () => {
    // Arrange
    mockLogin.mockResolvedValue({
      success: false,
      error: "Invalid credentials",
    });
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    renderLoginForm(onSuccessMock);

    // Act
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Assert
    await waitFor(() => {
      expect(onSuccessMock).not.toHaveBeenCalled();
    });
  });

  it("should display error message when login fails", async () => {
    // Arrange
    const errorMessage = "Invalid email or password";
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: errorMessage,
      setError: mockSetError,
    });

    // Act
    renderLoginForm();

    // Assert
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should clear error when user starts typing", async () => {
    // Arrange
    useAuthStore.mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: "Invalid credentials",
      setError: mockSetError,
    });
    const user = userEvent.setup();
    renderLoginForm();

    // Act
    await user.type(screen.getByLabelText(/email/i), "t");

    // Assert
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it("should toggle password visibility when eye icon is clicked", async () => {
    // Arrange
    const user = userEvent.setup();
    renderLoginForm();
    const passwordInput = screen.getByLabelText(/password/i);

    // Assert initial state
    expect(passwordInput).toHaveAttribute("type", "password");

    // Act - click the eye icon to show password
    await user.click(screen.getByRole("button", { name: "" })); // The eye button doesn't have text

    // Assert toggled state
    expect(passwordInput).toHaveAttribute("type", "text");

    // Act - click again to hide
    await user.click(screen.getByRole("button", { name: "" }));

    // Assert toggled back
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("should have required validation on email and password fields", async () => {
    // Arrange
    renderLoginForm();
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Assert
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
