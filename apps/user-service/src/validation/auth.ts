import { z } from 'zod';

// Base user schema for this service
const BaseUserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']).optional().default('USER'),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

// User authentication validation schemas
export const LoginSchema = BaseUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const CreateUserSchema = BaseUserSchema.extend({
  role: z.enum(['ADMIN', 'USER']).optional().default('USER'),
});

export const UpdateUserSchema = BaseUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
