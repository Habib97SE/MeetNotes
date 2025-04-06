import { supabase } from '../config/supabase';
import { withRetry } from '../utils/supabaseRetry';
import { logger } from '../utils/logger';

export interface UserProfile {
  id?: string;
  email?: string;
  phone_number?: string;
  profile_picture?: string;
  street?: string;
  city?: string;
  zip_code?: string;
  state?: string;
  country?: string;
  birth_date?: string | null;
  full_name?: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  full_name: string;
}

export interface UpdateUserParams extends Omit<UserProfile, 'id' | 'email'> {
  id: string;
}

/**
 * User service that handles user management operations
 */
export class UserService {
  /**
   * Get user by ID
   * @param id - User ID
   * @returns User profile data
   */
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      logger.info(`Getting user profile for ID: ${id}`);
      
      // First get the user's auth data
      const { data: authUser, error: authError } = await withRetry(
        () => supabase.auth.admin.getUserById(id),
        { operationName: 'Get user auth data' }
      );
      
      if (authError || !authUser.user) {
        logger.error(`Failed to get auth user with ID: ${id}`, authError);
        return null;
      }
      
      // Then get the user's profile data from the profiles table
      const { data: profile, error: profileError } = await withRetry(
        () => supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single(),
        { operationName: 'Get user profile data' }
      );
      
      if (profileError) {
        logger.error(`Failed to get profile for user ID: ${id}`, profileError);
      }
      
      // Combine auth data with profile data
      return {
        id: authUser.user.id,
        email: authUser.user.email,
        full_name: authUser.user.user_metadata?.full_name || profile?.full_name,
        phone_number: profile?.phone_number,
        profile_picture: profile?.profile_picture,
        street: profile?.street,
        city: profile?.city,
        zip_code: profile?.zip_code,
        state: profile?.state,
        country: profile?.country,
        birth_date: profile?.birth_date
      };
    } catch (error) {
      logger.error(`Error getting user by ID: ${id}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }
  
  /**
   * Update user profile information
   * @param params - User profile parameters to update
   * @returns Updated user profile data
   */
  async updateUser(params: UpdateUserParams): Promise<UserProfile> {
    try {
      const { id, ...profileData } = params;
      logger.info(`Updating profile for user ID: ${id}`);
      
      // Update user metadata in auth if full_name is provided
      if (profileData.full_name) {
        const { error: authError } = await withRetry(
          () => supabase.auth.admin.updateUserById(id, {
            user_metadata: { full_name: profileData.full_name }
          }),
          { operationName: 'Update user metadata' }
        );
        
        if (authError) {
          logger.error(`Failed to update auth metadata for user ID: ${id}`, authError);
          throw authError;
        }
      }
      
      // Check if profile exists
      const { data: existingProfile } = await withRetry(
        () => supabase
          .from('profiles')
          .select('id')
          .eq('id', id)
          .single(),
        { operationName: 'Check profile existence' }
      );
      
      let profileResult;
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await withRetry(
          () => supabase
            .from('profiles')
            .update(profileData)
            .eq('id', id)
            .select()
            .single(),
          { operationName: 'Update user profile' }
        );
        
        if (error) {
          logger.error(`Failed to update profile for user ID: ${id}`, error);
          throw error;
        }
        
        profileResult = data;
      } else {
        // Insert new profile
        const { data, error } = await withRetry(
          () => supabase
            .from('profiles')
            .insert({ id, ...profileData })
            .select()
            .single(),
          { operationName: 'Insert user profile' }
        );
        
        if (error) {
          logger.error(`Failed to insert profile for user ID: ${id}`, error);
          throw error;
        }
        
        profileResult = data;
      }
      
      // Get full user info after update
      const updatedUser = await this.getUserById(id);
      
      if (!updatedUser) {
        throw new Error(`Failed to retrieve updated user data for ID: ${id}`);
      }
      
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user: ${params.id}`, error instanceof Error ? error : undefined);
      throw error;
    }
  }
  
  /**
   * Get all users (admin function)
   * @returns List of all users
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      logger.info('Getting all users');
      
      // Get all users from auth.users
      const { data: users, error } = await withRetry(
        () => supabase.auth.admin.listUsers(),
        { operationName: 'List all users' }
      );
      
      if (error) {
        logger.error('Failed to list users', error);
        throw error;
      }
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await withRetry(
        () => supabase
          .from('profiles')
          .select('*'),
        { operationName: 'Get all profiles' }
      );
      
      if (profilesError) {
        logger.error('Failed to get profiles', profilesError);
        throw profilesError;
      }
      
      // Map profiles by ID for quick lookup
      const profilesMap = new Map();
      profiles?.forEach(profile => profilesMap.set(profile.id, profile));
      
      // Combine user auth data with profile data
      return users.users.map(user => {
        const profile = profilesMap.get(user.id);
        
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || profile?.full_name,
          phone_number: profile?.phone_number,
          profile_picture: profile?.profile_picture,
          street: profile?.street,
          city: profile?.city,
          zip_code: profile?.zip_code,
          state: profile?.state,
          country: profile?.country,
          birth_date: profile?.birth_date
        };
      });
    } catch (error) {
      logger.error('Error getting all users', error instanceof Error ? error : undefined);
      throw error;
    }
  }
}

// Export a singleton instance
export const userService = new UserService(); 