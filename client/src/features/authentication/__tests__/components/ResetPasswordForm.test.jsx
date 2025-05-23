import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import {
  BrowserRouter,
  MemoryRouter,
  Routes,
  Route,
  useParams,
} from "react-router-dom";
import ResetPasswordForm from "../../components/ResetPasswordForm";
import { authService } from "../../services/authService";

// Mock the auth service
jest.mock("../../services/authService", () => ({
  authService: {
    resetPassword: jest.fn(),
  },
}));

// Mock the auth store
const mockValidateResetToken = jest.fn();
const mockAuthStore = {
  isValidatingToken: false,
  isValidToken: true,
  tokenValidationError: null,
  validateResetToken: mockValidateResetToken,
};

jest.mock("../../store/authStore", () => ({
  useAuthStore: () => mockAuthStore,
}));

// Mock useNavigate and useParams from react-router-dom
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const originalModule = jest.requireActual("react-router-dom");
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
    useParams: jest.fn(() => ({ token: "test-reset-token" })),
  };
});

// Helper function to render ResetPasswordForm with Router
const renderResetPasswordForm = () => {
  return render(
    <BrowserRouter>
      <ResetPasswordForm />
    </BrowserRouter>
  );
};

describe("ResetPasswordForm Component", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset useParams mock to default behavior
    jest.mocked(useParams).mockReturnValue({ token: "test-reset-token" });

    // Reset auth store mock to default valid state
    mockAuthStore.isValidatingToken = false;
    mockAuthStore.isValidToken = true;
    mockAuthStore.tokenValidationError = null;

    // Default success response for password reset
    authService.resetPassword.mockResolvedValue({
      data: { status: "success", message: "Password reset successfully" },
    });
  });

  it("should render all form elements correctly", async () => {
    // Act
    renderResetPasswordForm();

    // Assert - Form should render immediately since token is valid
    expect(screen.getByText(/Set New Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Create a new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Reset Password/i })
    ).toBeInTheDocument();
  });

  it("should call validateResetToken on mount", () => {
    // Act
    renderResetPasswordForm();

    // Assert
    expect(mockValidateResetToken).toHaveBeenCalledWith("test-reset-token");
  });

  it("should call resetPassword service with token and passwords on submit", async () => {
    // Arrange
    renderResetPasswordForm();
    const passwordData = {
      password: "newPassword123",
      passwordConfirm: "newPassword123",
    };

    // Act - Use fireEvent instead of userEvent to avoid timing issues
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: passwordData.password },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: passwordData.passwordConfirm },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    // Assert
    await waitFor(() => {
      expect(authService.resetPassword).toHaveBeenCalledWith(
        "test-reset-token",
        passwordData
      );
    });
  });

  it("should show loading state during form submission", async () => {
    // Arrange
    renderResetPasswordForm();

    // Create an unresolved promise to keep the loading state active
    let resolvePromise;
    const promiseForResult = new Promise((resolve) => {
      // Capture the promise
      resolvePromise = () => {
        resolve({ data: { status: "success" } });
      };
    });
    authService.resetPassword.mockImplementation(() => promiseForResult);

    // Act - Fill form and submit
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    // Assert - Check for loading text
    await waitFor(() => {
      expect(screen.getByText(/Resetting/i)).toBeInTheDocument();
    });

    // Clean up - resolve the promise and wait for its effects within act
    await act(async () => {
      resolvePromise();
      await promiseForResult; // Wait for the promise to resolve and subsequent state updates
    });
  });

  it("should show success message after successful submission", async () => {
    // Arrange
    renderResetPasswordForm();

    // Act - Fill form and submit
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "newPassword123" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
      await Promise.resolve(); // Flush microtasks from immediate promise resolution
    });

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/Password reset successful/i)
      ).toBeInTheDocument();
    });
  });

  it("should navigate to login page after successful password reset", async () => {
    // Arrange
    renderResetPasswordForm();

    // Mock setTimeout to execute immediately
    jest.useFakeTimers({ legacyFakeTimers: true });

    // Act - Fill form and submit
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "newPassword123" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
      await Promise.resolve(); // Flush microtasks for setSuccess/setIsLoading
    });

    // Wait for success message
    await waitFor(() => {
      expect(
        screen.getByText(/Password reset successful/i)
      ).toBeInTheDocument();
    });

    // Run all timers (including the setTimeout that navigates to login)
    act(() => {
      jest.runAllTimers();
    });

    // Check navigation
    expect(mockNavigate).toHaveBeenCalledWith("/login");

    // Cleanup
    jest.useRealTimers();
  }, 10000); // Increase timeout to 10 seconds

  it("should show error message when service call fails", async () => {
    // Arrange
    const errorMessage = "Something went wrong";
    authService.resetPassword.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });
    renderResetPasswordForm();

    // Act - Fill form and submit
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "newPassword123" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));
      await Promise.resolve(); // Flush microtasks from immediate promise resolution
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("should validate password length before submission", async () => {
    // Arrange
    renderResetPasswordForm();

    // Act - Enter short password and submit
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    // Assert
    expect(
      screen.getByText(/Password must be at least 8 characters long/i)
    ).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("should validate password match before submission", async () => {
    // Arrange
    renderResetPasswordForm();

    // Act - Enter mismatched passwords and submit
    fireEvent.change(screen.getByLabelText(/New Password/i), {
      target: { value: "Password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "DifferentPassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    // Assert
    expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it("should show loading state during token validation", () => {
    // Arrange - Set loading state
    mockAuthStore.isValidatingToken = true;
    mockAuthStore.isValidToken = false;

    // Act
    renderResetPasswordForm();

    // Assert
    expect(screen.getByText(/Validating reset link/i)).toBeInTheDocument();
    expect(screen.queryByText(/Set New Password/i)).not.toBeInTheDocument();
  });

  it("should show error component when token is invalid", () => {
    // Arrange - Set invalid token state
    mockAuthStore.isValidatingToken = false;
    mockAuthStore.isValidToken = false;
    mockAuthStore.tokenValidationError = "Token is invalid or has expired";

    // Act
    renderResetPasswordForm();

    // Assert - Should show error component instead of form
    expect(screen.getByText(/Link Expired/i)).toBeInTheDocument();
    expect(screen.queryByText(/Set New Password/i)).not.toBeInTheDocument();
  });

  it("should show error component when no token provided", () => {
    // Override useParams to return no token
    jest.mocked(useParams).mockReturnValueOnce({});

    // Arrange - Set invalid token state
    mockAuthStore.isValidatingToken = false;
    mockAuthStore.isValidToken = false;
    mockAuthStore.tokenValidationError = "No reset token provided";

    // Act
    renderResetPasswordForm();

    // Assert - Should show error component
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
    expect(screen.queryByText(/Set New Password/i)).not.toBeInTheDocument();
  });

  it("should navigate to login when 'Back to login' link is clicked", async () => {
    // Arrange
    renderResetPasswordForm();

    // Act - Click the "Back to login" link (note: it's a link, not a button)
    // Links in React Router actually use history.push inside, which we've mocked with mockNavigate
    const backToLoginLink = screen.getByText(/Back to login/i);
    fireEvent.click(backToLoginLink);

    // Assert - Since we're using BrowserRouter in tests,
    // the navigation doesn't actually use our mockNavigate function
    // Instead, we'll check if the link has the correct href
    expect(backToLoginLink).toHaveAttribute("href", "/login");
  });

  it("should have required validation on all fields", async () => {
    // Arrange
    renderResetPasswordForm();

    // Get form elements
    const passwordInput = screen.getByLabelText(/New Password/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);

    // Assert
    expect(passwordInput).toHaveAttribute("required");
    expect(confirmPasswordInput).toHaveAttribute("required");
  });
});
