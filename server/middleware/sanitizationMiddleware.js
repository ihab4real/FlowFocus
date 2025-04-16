/**
 * HTML sanitization middleware
 *
 * This middleware sanitizes HTML content to prevent XSS attacks.
 * It uses a whitelist approach to only allow specific HTML tags and attributes.
 *
 * Note: In a production environment, you should use a library like DOMPurify
 * or sanitize-html for more robust protection.
 */

// Tags and attributes that are allowed in note content
const ALLOWED_TAGS = [
  "p",
  "br",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "u",
  "strike",
  "blockquote",
  "pre",
  "code",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTRS = {
  a: ["href", "target", "rel"],
  img: ["src", "alt", "width", "height"],
  td: ["colspan", "rowspan"],
  th: ["colspan", "rowspan"],
};

/**
 * Very basic HTML sanitizer
 * Note: This is a simplified version. In production, use a proper library.
 */
const sanitizeHtml = (html) => {
  if (!html) return "";

  // For this simplified version, we'll just remove script tags and potentially harmful attributes
  let sanitized = html
    // Remove script tags and their content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove onclick and other event handlers
    .replace(/\s(on\w+)="[^"]*"/gi, "")
    // Remove javascript: URLs
    .replace(/javascript:[^\s'"]+/gi, "");

  return sanitized;
};

/**
 * Middleware to sanitize request body fields
 * @param {Array} fields - Fields to sanitize
 */
export const sanitizeBody = (fields = ["content"]) => {
  return (req, res, next) => {
    if (req.body) {
      fields.forEach((field) => {
        if (req.body[field]) {
          req.body[field] = sanitizeHtml(req.body[field]);
        }
      });
    }
    next();
  };
};

export default sanitizeBody;
