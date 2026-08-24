import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validateRequest = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues[0];
        const errorMessage = issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload.';
        res.status(400).json({ error: `Validation Error: ${errorMessage}` });
        return;
      }
      res.status(400).json({ error: 'Invalid request body.' });
    }
  };
};

// 1. Authentication Schemas
export const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required').max(100, 'Login ID too long'),
  password: z.string().min(1, 'Password is required').max(255, 'Password too long'),
});

export const registerAdminSchema = z
  .object({
    companyName: z.string().min(1, 'Company or Admin name cannot be empty').max(255, 'Company name must be under 255 characters'),
    loginId: z
      .string()
      .min(3, 'Login ID must be at least 3 characters long')
      .max(50, 'Login ID cannot exceed 50 characters')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Login ID can only contain letters, numbers, hyphens, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters long').max(255, 'Password too long'),
    confirmPassword: z.string().optional(),
    phone: z.string().max(50).optional(),
    email: z.string().max(255).optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(255),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long').max(255),
});

// 2. Telecaller Admin Schemas
export const createTelecallerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  loginId: z.string().max(100).optional(),
  password: z.string().min(4, 'Password must be at least 4 characters').max(255).optional(),
  brandAccess: z.enum(['APNI_VIDYA', 'APNI_ESTATE', 'BOTH']),
  phone: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  dailyTarget: z.number().int().min(1).max(1000).optional(),
});

export const updateTelecallerSchema = z.object({
  name: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  brandAccess: z.enum(['APNI_VIDYA', 'APNI_ESTATE', 'BOTH']).optional(),
  dailyTarget: z.number().int().min(1).max(1000).optional(),
  isActive: z.boolean().optional(),
  password: z.string().max(255).optional(),
});

// 3. Lead Admin Schemas
export const createLeadSchema = z.object({
  name: z.string().min(1, 'Lead name is required').max(255),
  phone: z.string().min(1, 'Phone number is required').max(50),
  email: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  brand: z.enum(['APNI_VIDYA', 'APNI_ESTATE']),
  courseInterest: z.string().max(255).optional(),
  qualification: z.string().max(255).optional(),
  preferredBatch: z.string().max(255).optional(),
  propertyType: z.string().max(255).optional(),
  budget: z.string().max(100).optional(),
  preferredLocation: z.string().max(255).optional(),
  siteVisitDate: z.string().max(100).optional(),
  productInterest: z.string().max(255).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  assignedTo: z.string().max(100).nullable().optional(),
  status: z.enum([
    'NEW',
    'INTERESTED',
    'CALLBACK',
    'FOLLOW_UP',
    'DEMO',
    'ENROLLED',
    'SITE_VISIT_SCHEDULED',
    'NEGOTIATING',
    'CLOSED',
    'BOOKING',
    'SALE',
    'NOT_INTERESTED',
    'NO_ANSWER',
    'RINGING',
    'BUSY',
    'UNREACHABLE',
    'INVALID',
  ]).optional(),
});

export const assignLeadsSchema = z.object({
  leadIds: z.array(z.string().min(1)).min(1, 'At least one lead ID must be provided').max(1000),
  telecallerId: z.string().nullable(),
});

export const autoDistributeSchema = z.object({
  brand: z.enum(['ALL', 'APNI_VIDYA', 'APNI_ESTATE']).optional(),
});

export const importLeadsSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().min(1),
        phone: z.string().min(1),
        email: z.string().optional(),
        city: z.string().optional(),
        brand: z.enum(['APNI_VIDYA', 'APNI_ESTATE']).optional(),
        courseInterest: z.string().optional(),
        qualification: z.string().optional(),
        preferredBatch: z.string().optional(),
        propertyType: z.string().optional(),
        budget: z.string().optional(),
        preferredLocation: z.string().optional(),
        siteVisitDate: z.string().optional(),
        productInterest: z.string().optional(),
        source: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .max(5000, 'Maximum 5000 leads per import batch allowed.'),
  assignedToTelecallerId: z.string().nullable().optional(),
  defaultBrand: z.enum(['APNI_VIDYA', 'APNI_ESTATE']).optional(),
});

// 4. Telecaller Action Schemas
export const recordCallSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  status: z.enum([
    'NEW',
    'INTERESTED',
    'CALLBACK',
    'FOLLOW_UP',
    'DEMO',
    'ENROLLED',
    'SITE_VISIT_SCHEDULED',
    'NEGOTIATING',
    'CLOSED',
    'BOOKING',
    'SALE',
    'NOT_INTERESTED',
    'NO_ANSWER',
    'RINGING',
    'BUSY',
    'UNREACHABLE',
    'INVALID',
  ]),
  note: z.string().max(5000).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  callType: z.enum(['CALL', 'WHATSAPP']).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  followUp: z
    .object({
      dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be formatted YYYY-MM-DD'),
      dueTime: z.string().optional(),
      note: z.string().max(5000).optional(),
    })
    .optional(),
});

export const scheduleFollowUpSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be formatted YYYY-MM-DD'),
  dueTime: z.string().optional(),
  note: z.string().max(5000).optional(),
});

export const completeFollowUpSchema = z.object({
  note: z.string().max(5000).optional(),
  completionNote: z.string().max(5000).optional(),
});
