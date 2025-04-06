import { Request, Response } from 'express';
import { userService, UpdateUserParams } from '../services/userService';
import { s3Service } from '../services/s3Service';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase';

/**
 * Get current user's profile information
 * @param req - Request object
 * @param res - Response object
 */
export const getCurrentUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;

    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const userProfile = await userService.getUserById(user.id);

    if (!userProfile) {
      res.status(404).json({ message: 'User profile not found' });
      return;
    }

    res.status(200).json(userProfile);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error getting current user profile', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Update current user's profile information
 * @param req - Request object
 * @param res - Response object
 */
export const updateCurrentUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;

    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Extract profile data from the request body
    const {
      full_name,
      phone_number,
      street,
      city,
      zip_code,
      state,
      country,
      birth_date
    } = req.body;

    // Create update params object
    const updateParams: UpdateUserParams = {
      id: user.id,
      ...(full_name && { full_name }),
      ...(phone_number && { phone_number }),
      ...(street && { street }),
      ...(city && { city }),
      ...(zip_code && { zip_code }),
      ...(state && { state }),
      ...(country && { country }),
      ...(birth_date && { birth_date })
    };

    // Update the profile
    const updatedProfile = await userService.updateUser(updateParams);

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error updating user profile', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Update user's profile picture
 * @param req - Request object
 * @param res - Response object
 */
export const updateProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;

    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    // Check if file exists in request
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { buffer, mimetype, originalname } = req.file;

    // Only allow image files
    if (!mimetype.startsWith('image/')) {
      res.status(400).json({ message: 'Only image files are allowed for profile pictures' });
      return;
    }

    // Upload the file to S3
    const key = `profile-pictures/${user.id}/${Date.now()}-${originalname}`;
    await s3Service.uploadObject(key, buffer, mimetype);

    // Get the URL for the uploaded file
    const url = await s3Service.getSignedUrl(key);

    // Update user profile with the new profile picture URL
    const updatedProfile = await userService.updateUser({
      id: user.id,
      profile_picture: key
    });

    res.status(200).json({
      message: 'Profile picture updated successfully',
      profile_picture: {
        key,
        url
      },
      profile: updatedProfile
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error updating profile picture', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Change user's email
 * @param req - Request object
 * @param res - Response object
 */
export const changeEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;
    const { email } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    // Update email in Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { email }
    );

    if (error) {
      logger.error(`Failed to update email for user ID: ${user.id}`, error);
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(200).json({
      message: 'Email updated successfully. Verification email has been sent.'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error changing email', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Change user's password
 * @param req - Request object
 * @param res - Response object
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { user } = res.locals;
    const { password } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    // Update password in Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password }
    );

    if (error) {
      logger.error(`Failed to update password for user ID: ${user.id}`, error);
      res.status(400).json({ message: error.message });
      return;
    }

    res.status(200).json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error changing password', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
};

/**
 * Get all users (admin only)
 * @param req - Request object
 * @param res - Response object
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real application, add admin role check here
    const users = await userService.getAllUsers();
    
    res.status(200).json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error getting all users', error instanceof Error ? error : undefined);
    res.status(500).json({ message: errorMessage });
  }
}; 