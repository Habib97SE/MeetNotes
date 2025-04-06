import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware for validating requests against a Zod schema
 * @param schema - The Zod schema to validate against
 */
export const validateRequest = (schema: AnyZodObject) => (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    res.status(500).json({ message: 'An unexpected error occurred during validation' });
  }
}; 