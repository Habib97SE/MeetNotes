import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(2, 'Full name must be at least 2 characters')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

export const passwordResetRequestSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format')
  })
});

export const passwordResetSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters')
  })
});

// Types inferred from the schemas
export type SignupInput = z.infer<typeof signupSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>['body'];
export type PasswordResetInput = z.infer<typeof passwordResetSchema>['body']; 