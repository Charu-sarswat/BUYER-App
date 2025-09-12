import { z } from 'zod'

// Enums matching assignment requirements (CSV format)
export const PropertyTypeEnum = z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail'])
export const PurposeEnum = z.enum(['Buy', 'Rent'])
export const TimelineEnum = z.enum(['0-3m', '3-6m', '>6m', 'Exploring'])
export const BuyerStatusEnum = z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'])
export const CityEnum = z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'])
export const SourceEnum = z.enum(['Website', 'Referral', 'Walk-in', 'Call', 'Other'])
export const BHKEnum = z.enum(['1', '2', '3', '4', 'Studio'])

// Transform functions to convert CSV values to Prisma enum values
export const transformTimeline = z.enum(['0-3m', '3-6m', '>6m', 'Exploring']).transform((val) => {
  switch (val) {
    case '0-3m': return 'ZERO_TO_THREE_MONTHS'
    case '3-6m': return 'THREE_TO_SIX_MONTHS'
    case '>6m': return 'MORE_THAN_SIX_MONTHS'
    case 'Exploring': return 'Exploring'
    default: return val
  }
})

export const transformBHK = z.enum(['1', '2', '3', '4', 'Studio']).transform((val) => {
  switch (val) {
    case '1': return 'ONE'
    case '2': return 'TWO'
    case '3': return 'THREE'
    case '4': return 'FOUR'
    case 'Studio': return 'Studio'
    default: return val
  }
})

export const transformSource = z.enum(['Website', 'Referral', 'Walk-in', 'Call', 'Other']).transform((val) => {
  switch (val) {
    case 'Walk-in': return 'Walk_in'
    default: return val
  }
})

// Base buyer schema for form submission (raw assignment values)
const BaseBuyerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80, 'Full name must be at most 80 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15, 'Phone must be at most 15 digits'),
  city: CityEnum,
  propertyType: PropertyTypeEnum,
  bhk: BHKEnum.optional(),
  purpose: PurposeEnum,
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  timeline: TimelineEnum,
  source: SourceEnum,
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  tags: z.string().optional(),
})

// Form schema for client-side validation (no transform)
export const CreateBuyerFormSchema = BaseBuyerSchema.refine(
  (data) => {
    if (data.propertyType === 'Apartment' || data.propertyType === 'Villa') {
      return data.bhk !== undefined
    }
    return true
  },
  {
    message: 'BHK is required for Apartment and Villa property types',
    path: ['bhk'],
  }
).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMin <= data.budgetMax
    }
    return true
  },
  {
    message: 'Minimum budget must be less than or equal to maximum budget',
    path: ['budgetMin'],
  }
)

// API schema with transform for database storage
export const CreateBuyerSchema = CreateBuyerFormSchema.transform((data) => ({
  ...data,
  // Transform assignment values to Prisma enum values
  timeline: data.timeline === '0-3m' ? 'ZERO_TO_THREE_MONTHS' :
            data.timeline === '3-6m' ? 'THREE_TO_SIX_MONTHS' :
            data.timeline === '>6m' ? 'MORE_THAN_SIX_MONTHS' :
            data.timeline,
  bhk: data.bhk === '1' ? 'ONE' :
       data.bhk === '2' ? 'TWO' :
       data.bhk === '3' ? 'THREE' :
       data.bhk === '4' ? 'FOUR' :
       data.bhk,
  source: data.source === 'Walk-in' ? 'Walk_in' : data.source,
}))

// Update buyer form schema (for client-side validation)
export const UpdateBuyerFormSchema = BaseBuyerSchema.partial().extend({
  id: z.string().cuid().optional(),
  updatedAt: z.string().datetime().optional(),
  status: BuyerStatusEnum.optional(),
}).refine(
  (data) => {
    if (data.propertyType === 'Apartment' || data.propertyType === 'Villa') {
      return data.bhk !== undefined
    }
    return true
  },
  {
    message: 'BHK is required for Apartment and Villa property types',
    path: ['bhk'],
  }
).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMin <= data.budgetMax
    }
    return true
  },
  {
    message: 'Minimum budget must be less than or equal to maximum budget',
    path: ['budgetMin'],
  }
)

// Update buyer API schema (with transform for database storage)
export const UpdateBuyerSchema = UpdateBuyerFormSchema.transform((data) => ({
  ...data,
  // Transform assignment values to Prisma enum values
  timeline: data.timeline === '0-3m' ? 'ZERO_TO_THREE_MONTHS' :
            data.timeline === '3-6m' ? 'THREE_TO_SIX_MONTHS' :
            data.timeline === '>6m' ? 'MORE_THAN_SIX_MONTHS' :
            data.timeline,
  bhk: data.bhk === '1' ? 'ONE' :
       data.bhk === '2' ? 'TWO' :
       data.bhk === '3' ? 'THREE' :
       data.bhk === '4' ? 'FOUR' :
       data.bhk,
  source: data.source === 'Walk-in' ? 'Walk_in' : data.source,
  status: data.status === 'New' ? 'NEW' :
          data.status === 'Contacted' ? 'CONTACTED' :
          data.status === 'Qualified' ? 'QUALIFIED' :
          data.status === 'Visited' ? 'VISITED' :
          data.status === 'Negotiation' ? 'NEGOTIATION' :
          data.status === 'Converted' ? 'CONVERTED' :
          data.status === 'Dropped' ? 'DROPPED' :
          data.status,
}))

// CSV row schema for import validation (with transforms)
export const CsvRowSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(80, 'Full name must be at most 80 characters'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15, 'Phone must be at most 15 digits'),
  city: CityEnum,
  propertyType: PropertyTypeEnum,
  bhk: z.string().optional().transform((val) => {
    if (!val || val.trim() === '') return undefined
    return transformBHK.parse(val)
  }),
  purpose: PurposeEnum,
  budgetMin: z.string().optional().transform((val) => {
    if (!val) return undefined
    const num = parseInt(val, 10)
    return isNaN(num) ? undefined : num
  }),
  budgetMax: z.string().optional().transform((val) => {
    if (!val) return undefined
    const num = parseInt(val, 10)
    return isNaN(num) ? undefined : num
  }),
  timeline: transformTimeline,
  source: transformSource,
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  tags: z.string().optional(),
  status: BuyerStatusEnum.optional(),
}).refine(
  (data) => {
    if (data.propertyType === 'Apartment' || data.propertyType === 'Villa') {
      return data.bhk !== undefined
    }
    return true
  },
  {
    message: 'BHK is required for Apartment and Villa property types',
    path: ['bhk'],
  }
).refine(
  (data) => {
    if (data.budgetMin && data.budgetMax) {
      return data.budgetMin <= data.budgetMax
    }
    return true
  },
  {
    message: 'Minimum budget must be less than or equal to maximum budget',
    path: ['budgetMin'],
  }
)

// Query parameters schema for buyers list
export const BuyersQuerySchema = z.object({
  page: z.string().optional().transform((val) => {
    const num = parseInt(val || '1', 10)
    return isNaN(num) || num < 1 ? 1 : num
  }),
  limit: z.string().optional().transform((val) => {
    const num = parseInt(val || '10', 10)
    return isNaN(num) || num < 1 || num > 100 ? 10 : num
  }),
  search: z.string().optional(),
  city: z.string().optional(),
  propertyType: PropertyTypeEnum.optional(),
  status: BuyerStatusEnum.optional(),
  timeline: TimelineEnum.optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'fullName']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

// Types
export type CreateBuyerFormInput = z.infer<typeof BaseBuyerSchema> // Form input type (assignment values)
export type CreateBuyerInput = z.infer<typeof CreateBuyerSchema> // API input type (transformed values)
export type UpdateBuyerFormInput = z.infer<typeof UpdateBuyerFormSchema> // Form input type (assignment values)
export type UpdateBuyerInput = z.infer<typeof UpdateBuyerSchema> // API input type (transformed values)
export type CsvRowInput = z.infer<typeof CsvRowSchema>
export type BuyersQueryInput = z.infer<typeof BuyersQuerySchema>
export type PropertyType = z.infer<typeof PropertyTypeEnum>
export type Purpose = z.infer<typeof PurposeEnum>
export type Timeline = z.infer<typeof TimelineEnum>
export type BuyerStatus = z.infer<typeof BuyerStatusEnum>
