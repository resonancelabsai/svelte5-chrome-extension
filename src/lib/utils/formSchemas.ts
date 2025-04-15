import { z } from 'zod';

/**
 * Base form schema for organization validation
 */
export const formSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters' }),
  description: z.string().min(3, { message: 'Description must be at least 3 characters' }),
});

/**
 * Document form schema for validation
 */
export const documentFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  type: z.enum(['brand', 'company', 'design', 'communication', 'custom']),
  content: z.string(),
  versionComment: z.string().optional(),
});

/**
 * Type definitions for the form data
 */
export type FormSchema = z.infer<typeof formSchema>;
export type DocumentFormSchema = z.infer<typeof documentFormSchema>; 