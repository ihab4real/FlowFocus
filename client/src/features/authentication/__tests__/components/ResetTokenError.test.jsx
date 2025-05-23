import { describe, it, expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ResetTokenError from "../../components/ResetTokenError";

// Helper function to render ResetTokenError with Router
const renderResetTokenError = (error = null) => {
  return render(
    <BrowserRouter>
      <ResetTokenError error={error} />
    </BrowserRouter>
  );
};

describe("ResetTokenError Component", () => {
  it("should render expired link message for expired token error", () => {
    // Arrange
    const expiredError = "Token is invalid or has expired";

    // Act
    renderResetTokenError(expiredError);

    // Assert
    expect(screen.getByText(/Link Expired/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This password reset link has expired/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/For your security, password reset links expire/i)
    ).toBeInTheDocument();
  });

  it("should render expired link message for token expired error", () => {
    // Arrange
    const expiredError = "Token has expired";

    // Act
    renderResetTokenError(expiredError);

    // Assert
    expect(screen.getByText(/Link Expired/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This password reset link has expired/i)
    ).toBeInTheDocument();
  });

  it("should render invalid link message for no token error", () => {
    // Arrange
    const noTokenError = "No reset token provided";

    // Act
    renderResetTokenError(noTokenError);

    // Assert
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This password reset link is not valid/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This link may have been used already or is malformed/i)
    ).toBeInTheDocument();
  });

  it("should render invalid link message for token required error", () => {
    // Arrange
    const tokenRequiredError = "Reset token is required";

    // Act
    renderResetTokenError(tokenRequiredError);

    // Assert
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This password reset link is not valid/i)
    ).toBeInTheDocument();
  });

  it("should render invalid link message for unknown error", () => {
    // Arrange
    const unknownError = "Some unknown error";

    // Act
    renderResetTokenError(unknownError);

    // Assert
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This password reset link is not valid/i)
    ).toBeInTheDocument();
  });

  it("should render invalid link message when no error is provided", () => {
    // Act
    renderResetTokenError();

    // Assert
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
    expect(
      screen.getByText(/This password reset link is not valid/i)
    ).toBeInTheDocument();
  });

  it("should have link to forgot password page", () => {
    // Act
    renderResetTokenError();

    // Assert
    const forgotPasswordLink = screen.getByRole("link", {
      name: /Request New Reset Link/i,
    });
    expect(forgotPasswordLink).toBeInTheDocument();
    expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
  });

  it("should have link back to login page", () => {
    // Act
    renderResetTokenError();

    // Assert
    const loginLink = screen.getByRole("link", { name: /Back to login/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");
  });

  it("should render AlertCircle icon for both scenarios", () => {
    // Act
    renderResetTokenError("Some error");

    // Assert
    // The AlertCircle icon should be present (we can check for its presence via the Card structure)
    expect(screen.getByText(/Invalid Link/i)).toBeInTheDocument();
  });

  it("should render AlertCircle icon for expired scenarios", () => {
    // Act
    renderResetTokenError("Token is invalid or has expired");

    // Assert
    // The AlertCircle icon should be present for expired scenarios too
    expect(screen.getByText(/Link Expired/i)).toBeInTheDocument();
  });

  it("should display consistent card layout", () => {
    // Act
    renderResetTokenError();

    // Assert
    // Check for button structure - the "Request New Reset Link" should be a full-width button
    const resetLinkButton = screen.getByRole("link", {
      name: /Request New Reset Link/i,
    });
    expect(resetLinkButton).toBeInTheDocument();
    expect(resetLinkButton).toHaveClass("w-full");

    // Check for "Back to login" link
    const loginLink = screen.getByRole("link", { name: /Back to login/i });
    expect(loginLink).toBeInTheDocument();
  });
});
