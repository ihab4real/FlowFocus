import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import RegisterForm from "../../components/RegisterForm";
import { useAuthStore } from "../../store/authStore";

// Mock the auth store
jest.mock("../../store/authStore", () => ({
  useAuthStore: jest.fn(),
}));

// Helper function to render RegisterForm with Router
const renderRegisterForm = (onSuccess = jest.fn()) => {
  return render(
    <BrowserRouter>
      <RegisterForm onSuccess={onSuccess} />
    </BrowserRouter>
  );
};

describe("RegisterForm Component", () => {
  // Mock register function
  const mockRegister = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Default mock implementation
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      setError: mockSetError,
    });

    // Default success response
    mockRegister.mockResolvedValue({ success: true });
  });

  it("should render all form elements correctly", () => {
    // Act
    renderRegisterForm();

    // Assert
    expect(screen.getByText("Create an account")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should call register function with form data on submit", async () => {
    // Arrange
    const user = userEvent.setup();
    const mockUserData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      passwordConfirm: "password123",
    };
    renderRegisterForm();

    // Act
    await user.type(screen.getByLabelText(/name/i), mockUserData.name);
    await user.type(screen.getByLabelText(/email/i), mockUserData.email);
    await user.type(screen.getByLabelText("Password"), mockUserData.password);
    await user.type(
      screen.getByLabelText(/confirm password/i),
      mockUserData.passwordConfirm
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    expect(mockRegister).toHaveBeenCalledWith(mockUserData);
  });

  it("should show loading state during form submission", async () => {
    // Arrange
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      setError: mockSetError,
    });
    renderRegisterForm();

    // Assert
    const submitButton = screen.getByRole("button", {
      name: /creating account/i,
    });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("should call onSuccess callback when registration succeeds", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    renderRegisterForm(onSuccessMock);

    // Act
    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  it("should not call onSuccess callback when registration fails", async () => {
    // Arrange
    mockRegister.mockResolvedValue({
      success: false,
      error: "Email already exists",
    });
    const user = userEvent.setup();
    const onSuccessMock = jest.fn();
    renderRegisterForm(onSuccessMock);

    // Act
    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "existing@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    await waitFor(() => {
      expect(onSuccessMock).not.toHaveBeenCalled();
    });
  });

  it("should display error message when registration fails", async () => {
    // Arrange
    const errorMessage = "Email already exists";
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: errorMessage,
      setError: mockSetError,
    });

    // Act
    renderRegisterForm();

    // Assert
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("should clear error when user starts typing", async () => {
    // Arrange
    useAuthStore.mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: "Email already exists",
      setError: mockSetError,
    });
    const user = userEvent.setup();
    renderRegisterForm();

    // Act
    await user.type(screen.getByLabelText(/email/i), "t");

    // Assert
    expect(mockSetError).toHaveBeenCalledWith(null);
  });

  it("should show error when passwords do not match", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegisterForm();

    // Act
    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should show error for invalid email format", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegisterForm();

    // Act
    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "invalid-email");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Use findByText to locate the error message with a more relaxed pattern
    // and wait for it to appear in the DOM
    const errorElement = await screen.findByText(/Please enter a valid email/i);
    expect(errorElement).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should show error for short password", async () => {
    // Arrange
    const user = userEvent.setup();
    renderRegisterForm();

    // Act
    await user.type(screen.getByLabelText(/name/i), "Test User");
    await user.type(screen.getByLabelText(/email/i), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "short");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    // Assert
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("should have required validation on all fields", async () => {
    // Arrange
    renderRegisterForm();

    // Get form elements
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText("Password");
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    // Assert
    expect(nameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(confirmPasswordInput).toBeRequired();
  });
});
