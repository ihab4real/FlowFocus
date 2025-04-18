import { jest } from '@jest/globals';

// --- Mock Dependencies --- 
jest.unstable_mockModule('../../../models/userModel.js', () => ({
  __esModule: true,
  default: {
    findByIdAndUpdate: jest.fn(),
    // Add other model methods if needed by other service functions
  },
}));

jest.unstable_mockModule('../../../utils/AppError.js', () => ({
  __esModule: true,
  errorTypes: {
    badRequest: jest.fn((msg) => new Error(msg)),
    notFound: jest.fn((msg) => new Error(msg)),
  },
}));

jest.unstable_mockModule('../../../utils/logger.js', () => ({
  __esModule: true,
  logInfo: jest.fn(),
  // Add other log levels if needed
}));

// --- Import Modules Under Test & Mocks --- 
const { updateUserProfile } = await import('../../../services/userService.js');
const User = (await import('../../../models/userModel.js')).default;
const { errorTypes } = (await import('../../../utils/AppError.js'));

describe('User Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserProfile', () => {
    const userId = 'userToUpdate';
    const validUpdateData = { name: 'New Name', email: 'new.email@example.com' };
    const mockUpdatedUser = { _id: userId, ...validUpdateData };

    it('should update user profile successfully with allowed fields', async () => {
      // Arrange
      User.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await updateUserProfile(userId, validUpdateData);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        validUpdateData, // Ensure only allowed fields were passed
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockUpdatedUser);
      // expect(logInfo).toHaveBeenCalled(); // Optional
    });

    it('should filter out disallowed fields before updating', async () => {
      // Arrange
      const updateDataWithDisallowed = {
        name: 'Another New Name',
        role: 'admin', // Disallowed
      };
      const expectedFilteredData = { name: 'Another New Name' }; // Only name should remain
      const mockFilteredUser = { _id: userId, ...expectedFilteredData }; 
      User.findByIdAndUpdate.mockResolvedValue(mockFilteredUser);

      // Act
      const result = await updateUserProfile(userId, updateDataWithDisallowed);

      // Assert
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        expectedFilteredData, // Check that only allowed fields were passed
        { new: true, runValidators: true }
      );
      expect(result).toEqual(mockFilteredUser);
    });

    it('should throw badRequest if password fields are included', async () => {
      // Arrange
      const updateDataWithPassword = { name: 'Test', password: 'newpass' };

      // Act & Assert
      await expect(updateUserProfile(userId, updateDataWithPassword))
        .rejects.toThrow('This route is not for password updates');
      expect(errorTypes.badRequest).toHaveBeenCalledWith(expect.stringContaining('not for password updates'));
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });
    
    it('should throw badRequest if only disallowed fields are provided', async () => {
        // Arrange
        const updateDataOnlyDisallowed = { role: 'admin', unknownField: 'test' }; 

        // Act & Assert
        await expect(updateUserProfile(userId, updateDataOnlyDisallowed))
            .rejects.toThrow('No valid fields provided for update');
        expect(errorTypes.badRequest).toHaveBeenCalledWith('No valid fields provided for update.');
        expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw notFound if user is not found by ID', async () => {
      // Arrange
      User.findByIdAndUpdate.mockResolvedValue(null); // User not found

      // Act & Assert
      await expect(updateUserProfile(userId, validUpdateData))
        .rejects.toThrow('User not found for update.');
      expect(errorTypes.notFound).toHaveBeenCalledWith('User not found for update.');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        validUpdateData,
        { new: true, runValidators: true }
      );
    });

    it('should throw badRequest on validation error during update', async () => {
      // Arrange
      const validationError = new Error('Invalid email format');
      validationError.name = 'ValidationError';
      User.findByIdAndUpdate.mockRejectedValue(validationError);

      // Act & Assert
      await expect(updateUserProfile(userId, validUpdateData))
        .rejects.toThrow('Invalid email format');
      expect(errorTypes.badRequest).toHaveBeenCalledWith('Invalid email format');
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        validUpdateData,
        { new: true, runValidators: true }
      );
    });

    it('should re-throw other errors during update', async () => {
        // Arrange
        const genericError = new Error('DB connection failed');
        User.findByIdAndUpdate.mockRejectedValue(genericError);

        // Act & Assert
        await expect(updateUserProfile(userId, validUpdateData))
            .rejects.toThrow('DB connection failed');
        expect(errorTypes.badRequest).not.toHaveBeenCalled();
        expect(errorTypes.notFound).not.toHaveBeenCalled();
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
            userId,
            validUpdateData,
            { new: true, runValidators: true }
        );
    });
  });

  // --- Add tests for other userService functions if they exist --- 
}); 