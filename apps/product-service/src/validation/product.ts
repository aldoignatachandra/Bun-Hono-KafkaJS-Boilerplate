import { z } from 'zod';

// Base product schema for this service
const BaseProductSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  price: z.number().positive('Price must be positive').int('Price must be an integer'),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deletedAt: z.date().optional(),
});

// Product validation schemas
export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  price: z.number().positive('Price must be positive').int('Price must be an integer'),
  ownerId: z.string().uuid('Owner ID must be a valid UUID'),
});

export const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .optional(),
  price: z.number().positive('Price must be positive').int('Price must be an integer').optional(),
  ownerId: z.string().uuid('Owner ID must be a valid UUID').optional(),
});

// Type exports
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
