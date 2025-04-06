import { z } from 'zod';

/**
 * Schema for user profile update
 */
export const updateProfileSchema = z.object({
  body: z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone_number: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    zip_code: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    birth_date: z.string()
      .refine(
        (val) => {
          // Optional field - allow empty string or valid date
          if (!val) return true;
          
          // Check if string is a valid date
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: 'Birth date must be a valid date string' }
      )
      .optional(),
  })
});

/**
 * Schema for changing email
 */
export const changeEmailSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format')
  })
});

/**
 * Schema for changing password
 */
export const changePasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

// Types inferred from the schemas
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body']; 