import { jest } from '@jest/globals';

// --- Mock Dependencies --- 
// Mock tokenService (used by protect middleware)
jest.unstable_mockModule('../../../services/tokenService.js', () => ({
  __esModule: true,
  verifyAccessToken: jest.fn(),
}));

// Mock User model (used by protect middleware)
jest.unstable_mockModule('../../../models/userModel.js', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

// Mock AppError (used by protect and restrictTo)
jest.unstable_mockModule('../../../utils/AppError.js', () => ({
  __esModule: true,
  errorTypes: {
    unauthorized: jest.fn((msg) => new Error(msg)), // Create actual errors for testing
    forbidden: jest.fn((msg) => new Error(msg)),
  },
}));

// Mock asyncHandler (wrapper for route handlers/middleware)
// We assume asyncHandler just calls the function passed to it and handles errors.
// For unit testing the middleware logic itself, we can often call the inner function directly.
// Alternatively, mock it to simply return the function passed to it.
jest.unstable_mockModule('../../../utils/asyncHandler.js', () => ({
    __esModule: true,
    // Updated mock to handle errors correctly
    default: jest.fn(fn => {
        // Return the async function that asyncHandler would normally return
        return async (req, res, next) => {
            try {
                // Execute the original middleware function passed to asyncHandler
                await fn(req, res, next);
            } catch (err) {
                // If the middleware function throws, catch it and pass to next()
                // In the test context, next === mockNext
                next(err);
            }
        };
    }),
}));

// Mock logger (optional, if used inside middleware)
jest.unstable_mockModule('../../../utils/logger.js', () => ({
  __esModule: true,
  logDebug: jest.fn(),
}));


// --- Import Modules Under Test & Mocks --- 
// Import the middleware functions *after* mocks
const { protect, restrictTo } = await import('../../../middleware/authMiddleware.js');

// Import mocks for verification
const { verifyAccessToken } = await import('../../../services/tokenService.js');
const User = (await import('../../../models/userModel.js')).default;
const { errorTypes } = await import('../../../utils/AppError.js');

describe('Auth Middleware - Unit Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    // Basic mocks for Express request, response, and next function
    mockReq = {
      headers: {},
      user: null, // Ensure req.user starts null
    };
    mockRes = {
      // Mock response methods if needed (e.g., res.status().json()...)
    };
    mockNext = jest.fn();
  });

  describe('protect middleware', () => {
    const token = 'validAccessToken123';
    const userId = 'userDecodedFromToken';
    const decodedPayload = { id: userId };
    const mockCurrentUser = { _id: userId, name: 'Test User', role: 'user' };

    it('should call next() and attach user to req if token is valid and user exists', async () => {
      // Arrange
      mockReq.headers.authorization = `Bearer ${token}`;
      verifyAccessToken.mockResolvedValue(decodedPayload);
      User.findById.mockResolvedValue(mockCurrentUser);

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.headers.authorization).toBe(`Bearer ${token}`);
      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockReq.user).toEqual(mockCurrentUser);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // Called with no error
    });

    it('should call next with unauthorized error if no token is provided', async () => {
      // Arrange
      mockReq.headers.authorization = undefined;

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyAccessToken).not.toHaveBeenCalled();
      expect(User.findById).not.toHaveBeenCalled();
      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(errorTypes.unauthorized).toHaveBeenCalledWith('You are not logged in. Please log in to get access.');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error)); // Check that *an* error was passed
    });
    
    it('should call next with unauthorized error if token format is invalid', async () => {
        // Arrange
        mockReq.headers.authorization = `InvalidFormat ${token}`;

        // Act
        await protect(mockReq, mockRes, mockNext);

        // Assert
        expect(verifyAccessToken).not.toHaveBeenCalled();
        expect(User.findById).not.toHaveBeenCalled();
        expect(mockReq.user).toBeNull();
        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(errorTypes.unauthorized).toHaveBeenCalledWith('You are not logged in. Please log in to get access.');
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error)); 
    });

    it('should call next with unauthorized error if verifyAccessToken fails (JsonWebTokenError)', async () => {
      // Arrange
      mockReq.headers.authorization = `Bearer ${token}`;
      const jwtError = new Error('Invalid signature');
      jwtError.name = 'JsonWebTokenError';
      verifyAccessToken.mockRejectedValue(jwtError);

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(User.findById).not.toHaveBeenCalled();
      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(errorTypes.unauthorized).toHaveBeenCalledWith('Invalid session. Please log in again.');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call next with unauthorized error if verifyAccessToken fails (TokenExpiredError)', async () => {
      // Arrange
      mockReq.headers.authorization = `Bearer ${token}`;
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      verifyAccessToken.mockRejectedValue(expiredError);

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(User.findById).not.toHaveBeenCalled();
      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(errorTypes.unauthorized).toHaveBeenCalledWith('Your session has expired. Please log in again.');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

     it('should call next with unauthorized error if user belonging to token no longer exists', async () => {
      // Arrange
      mockReq.headers.authorization = `Bearer ${token}`;
      verifyAccessToken.mockResolvedValue(decodedPayload);
      User.findById.mockResolvedValue(null); // User not found

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(errorTypes.unauthorized).toHaveBeenCalledWith('The user belonging to this token no longer exists.');
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

     it('should call next with error for other errors during verification/user fetch', async () => {
      // Arrange
      mockReq.headers.authorization = `Bearer ${token}`;
      const genericError = new Error('Some other issue');
      verifyAccessToken.mockResolvedValue(decodedPayload);
      User.findById.mockRejectedValue(genericError); // Error fetching user

      // Act
      await protect(mockReq, mockRes, mockNext);

      // Assert
      expect(verifyAccessToken).toHaveBeenCalledWith(token);
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(mockReq.user).toBeNull();
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(genericError); // Should pass the original error
       // Ensure specific unauthorized errors weren't called
      expect(errorTypes.unauthorized).not.toHaveBeenCalled();
    });
  });

  describe('restrictTo middleware factory', () => {

    it('should call next() if user role is allowed', () => {
      // Arrange
      const allowedRoles = ['admin', 'manager'];
      mockReq.user = { _id: 'adminUserId', role: 'admin' }; // User set by protect
      const middleware = restrictTo(...allowedRoles); // Create the specific middleware instance
      
      // Act
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // No error
      expect(errorTypes.forbidden).not.toHaveBeenCalled();
    });

    it('should call next with forbidden error if user role is not allowed', () => {
      // Arrange
      const allowedRoles = ['admin', 'manager'];
      mockReq.user = { _id: 'userId', role: 'user' }; // User role not in allowedRoles
      const middleware = restrictTo(...allowedRoles);
      
      // Act & Assert
      // Verify that calling the middleware throws an error directly
      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(Error);
      // Verify the correct error type function was called
      expect(errorTypes.forbidden).toHaveBeenCalledWith('You do not have permission to perform this action');
      // Verify next was *not* called
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with forbidden error if req.user is not set', () => {
      // Arrange
      const allowedRoles = ['admin'];
      mockReq.user = null; // req.user is missing
      const middleware = restrictTo(...allowedRoles);
      
      // Act & Assert
      // Verify that calling the middleware throws an error directly
      expect(() => middleware(mockReq, mockRes, mockNext)).toThrow(Error);
      // Verify the correct error type function was called
      expect(errorTypes.forbidden).toHaveBeenCalledWith('You do not have permission to perform this action');
      // Verify next was *not* called
      expect(mockNext).not.toHaveBeenCalled();
    });
    
    it('should handle multiple allowed roles correctly', () => {
      // Arrange
      const allowedRoles = ['admin', 'user', 'guest'];
      mockReq.user = { _id: 'userId', role: 'user' }; 
      const middleware = restrictTo(...allowedRoles);
      
      // Act
      middleware(mockReq, mockRes, mockNext);
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(); // No error
      expect(errorTypes.forbidden).not.toHaveBeenCalled();
    });

  });

}); 