import nodemailer from "nodemailer";
import { logInfo, logError } from "../utils/logger.js";

const sender = {
  email: process.env.EMAIL_FROM_ADDRESS || "noreply@flowfocus.app",
  name: process.env.EMAIL_FROM_NAME || "FlowFocus",
};

// Creates the email transporter instance using SMTP configuration from environment variables.
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: parseInt(process.env.EMAIL_PORT || "587", 10) === 465, // Use SSL for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // tls: { rejectUnauthorized: false } // Uncomment for testing with local self-signed certificates
});

// --- HTML Content Generation ---
/**
 * Generates the HTML content for the password reset email.
 * Adheres to the branding guidelines specified in docs/client/branding.md.
 * @param {string} name - The recipient's name.
 * @param {string} resetUrl - The password reset URL.
 * @returns {string} The formatted HTML email content.
 */
const createPasswordResetHtml = (name, resetUrl) => {
  // Branding colors and styles
  const primaryColor = "#6C63FF";
  const lightBackground = "#FAFAFA";
  const cardBackground = "#FFFFFF";
  const textColor = "#1A202C"; // Dark text for light mode
  const subtleTextColor = "#555555";
  const footerTextColor = "#888888";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
      <title>Reset Your FlowFocus Password</title>
      <style>
        /* Basic Reset */
        body, html { margin: 0; padding: 0; width: 100%; font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        body { background-color: ${lightBackground}; padding: 20px 0; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        p { margin: 0 0 16px 0; }

        /* Container */
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: ${cardBackground};
          padding: 32px; /* Using spacing guidelines (e.g., space-xl) */
          border-radius: 8px;
          border: 1px solid #eeeeee; /* Subtle border often works better than shadow in email */
        }

        /* Header */
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .header h1 {
          color: ${primaryColor}; /* Primary brand color */
          margin: 0;
          font-family: 'Inter', sans-serif; /* Explicitly set heading font */
          font-weight: 700; /* Bold */
          font-size: 28px;
        }

        /* Content */
        .content {
          color: ${textColor};
          font-size: 16px;
          line-height: 1.6;
        }
        .content p {
          margin-bottom: 20px;
          color: ${subtleTextColor};
        }
        .content strong {
          color: ${textColor};
          font-weight: 700;
        }
        .button-container {
            text-align: center;
            margin: 32px 0;
        }

        /* Button */
        .button {
          display: inline-block;
          background-color: ${primaryColor}; /* Primary brand color */
          color: #ffffff !important; /* Ensure text color overrides link defaults */
          padding: 14px 28px; /* Adjusted padding */
          text-decoration: none !important; /* Remove underline */
          border-radius: 8px; /* Consistent corner radius */
          font-weight: 700; /* Bold body font */
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          border: none;
          cursor: pointer;
        }

        /* Footer */
        .footer {
          text-align: center;
          margin-top: 32px;
          font-size: 12px;
          color: ${footerTextColor};
        }
        .footer p { margin-bottom: 8px; }

        /* Responsive (Optional but good practice) */
        @media screen and (max-width: 640px) {
          .container { padding: 24px; }
          .header h1 { font-size: 24px; }
          .content { font-size: 15px; }
          .button { padding: 12px 24px; font-size: 15px; }
        }

      </style>
    </head>
    <body>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <div class="container">
              <div class="header">
                <h1>FlowFocus</h1>
              </div>
              <div class="content">
                <p>Hi ${name || "there"},</p>
                <p>We received a request to reset the password for your FlowFocus account. If you made this request, please click the button below to set a new password:</p>
                <div class="button-container">
                  <a href="${resetUrl}" target="_blank" class="button">Reset Password</a>
                </div>
                <p>This password reset link is valid for <strong>only 10 minutes</strong>.</p>
                <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Thanks,<br>The FlowFocus Team</p>
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} FlowFocus. All rights reserved.</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// --- Email Sending Function ---
/**
 * Constructs and sends a password reset email.
 * Uses the configured transporter and HTML generation function.
 * @param {string} toEmail - The recipient's email address.
 * @param {string} name - The recipient's name (used for personalization).
 * @param {string} resetToken - The unique password reset token.
 * @returns {Promise<void>} Resolves when the email is accepted by the transport.
 * @throws {Error} If email configuration is invalid or sending fails.
 */
export const sendPasswordResetEmail = async (toEmail, name, resetToken) => {
  // Construct the full password reset URL.
  const resetUrl = `${
    process.env.CLIENT_URL || "http://localhost:5173"
  }/reset-password/${resetToken}`;

  // Define email message options.
  const mailOptions = {
    from: `"${sender.name}" <${sender.email}>`,
    to: toEmail,
    subject: "Reset Your FlowFocus Password",
    html: createPasswordResetHtml(name, resetUrl),
    // Consider adding a plain text version for accessibility and older clients:
    // text: `Hi ${name || 'there'}, Reset your password here: ${resetUrl}`
  };

  try {
    logInfo("Attempting to send password reset email", { to: toEmail });

    // Send the email using the pre-configured transporter.
    const info = await transporter.sendMail(mailOptions);

    logInfo("Password reset email sent successfully", {
      to: toEmail,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (error) {
    logError("Failed to send password reset email", {
      to: toEmail,
      error: error?.message || error,
    });
    // Propagate a generic error to the calling service.
    throw new Error("Could not send password reset email.");
  }
};
