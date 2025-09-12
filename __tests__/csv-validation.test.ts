import { CsvRowSchema } from '@/lib/schemas'
import { parseCsvContent } from '@/lib/csv-utils'

describe('CSV Validation', () => {
  describe('CsvRowSchema', () => {
    it('should validate a valid CSV row', () => {
      const validRow = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        bhk: '2',
        purpose: 'INVESTMENT',
        budgetMin: '5000000',
        budgetMax: '8000000',
        timeline: 'IMMEDIATE',
        source: 'Website',
        notes: 'Interested in 2BHK apartment',
        tags: 'premium,urgent'
      }

      const result = CsvRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.fullName).toBe('John Doe')
        expect(result.data.email).toBe('john@example.com')
        expect(result.data.bhk).toBe(2)
        expect(result.data.budgetMin).toBe(5000000)
        expect(result.data.budgetMax).toBe(8000000)
      }
    })

    it('should validate a minimal valid CSV row', () => {
      const minimalRow = {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        city: 'Delhi',
        propertyType: 'PLOT',
        purpose: 'END_USE',
        timeline: 'THREE_TO_SIX'
      }

      const result = CsvRowSchema.safeParse(minimalRow)
      expect(result.success).toBe(true)
    })

    it('should require BHK for apartment and villa', () => {
      const apartmentWithoutBhk = {
        fullName: 'John Doe',
        email: 'john@example.com',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        purpose: 'INVESTMENT',
        timeline: 'IMMEDIATE'
      }

      const result = CsvRowSchema.safeParse(apartmentWithoutBhk)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('BHK is required')
      }
    })

    it('should validate budget constraints', () => {
      const invalidBudget = {
        fullName: 'John Doe',
        email: 'john@example.com',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        bhk: '2',
        purpose: 'INVESTMENT',
        budgetMin: '8000000',
        budgetMax: '5000000', // Max less than min
        timeline: 'IMMEDIATE'
      }

      const result = CsvRowSchema.safeParse(invalidBudget)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Minimum budget must be less than or equal to maximum budget')
      }
    })

    it('should reject invalid email', () => {
      const invalidEmail = {
        fullName: 'John Doe',
        email: 'invalid-email',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        bhk: '2',
        purpose: 'INVESTMENT',
        timeline: 'IMMEDIATE'
      }

      const result = CsvRowSchema.safeParse(invalidEmail)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid email address')
      }
    })

    it('should reject invalid property type', () => {
      const invalidPropertyType = {
        fullName: 'John Doe',
        email: 'john@example.com',
        city: 'Mumbai',
        propertyType: 'INVALID_TYPE',
        purpose: 'INVESTMENT',
        timeline: 'IMMEDIATE'
      }

      const result = CsvRowSchema.safeParse(invalidPropertyType)
      expect(result.success).toBe(false)
    })

    it('should reject invalid purpose', () => {
      const invalidPurpose = {
        fullName: 'John Doe',
        email: 'john@example.com',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        bhk: '2',
        purpose: 'INVALID_PURPOSE',
        timeline: 'IMMEDIATE'
      }

      const result = CsvRowSchema.safeParse(invalidPurpose)
      expect(result.success).toBe(false)
    })

    it('should reject invalid timeline', () => {
      const invalidTimeline = {
        fullName: 'John Doe',
        email: 'john@example.com',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        bhk: '2',
        purpose: 'INVESTMENT',
        timeline: 'INVALID_TIMELINE'
      }

      const result = CsvRowSchema.safeParse(invalidTimeline)
      expect(result.success).toBe(false)
    })

    it('should handle empty optional fields', () => {
      const rowWithEmptyFields = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '',
        city: 'Mumbai',
        propertyType: 'APARTMENT',
        bhk: '2',
        purpose: 'INVESTMENT',
        budgetMin: '',
        budgetMax: '',
        timeline: 'IMMEDIATE',
        source: '',
        notes: '',
        tags: ''
      }

      const result = CsvRowSchema.safeParse(rowWithEmptyFields)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.phone).toBeUndefined()
        expect(result.data.budgetMin).toBeUndefined()
        expect(result.data.budgetMax).toBeUndefined()
        expect(result.data.source).toBeUndefined()
        expect(result.data.notes).toBeUndefined()
        expect(result.data.tags).toBeUndefined()
      }
    })
  })

  describe('parseCsvContent', () => {
    it('should parse valid CSV content', () => {
      const csvContent = `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
John Doe,john@example.com,+1234567890,Mumbai,APARTMENT,2,INVESTMENT,5000000,8000000,IMMEDIATE,Website,Interested in 2BHK,premium
Jane Smith,jane@example.com,,Delhi,PLOT,,END_USE,,,THREE_TO_SIX,,,`

      const result = parseCsvContent(csvContent)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.totalRows).toBe(2)
      expect(result.validRows).toBe(2)
      expect(result.invalidRows).toBe(0)
      
      if (result.data) {
        expect(result.data[0].fullName).toBe('John Doe')
        expect(result.data[0].bhk).toBe(2)
        expect(result.data[1].fullName).toBe('Jane Smith')
        expect(result.data[1].bhk).toBeUndefined()
      }
    })

    it('should handle CSV with validation errors', () => {
      const csvContent = `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
John Doe,invalid-email,+1234567890,Mumbai,APARTMENT,2,INVESTMENT,5000000,8000000,IMMEDIATE,Website,Interested in 2BHK,premium
Jane Smith,jane@example.com,,Delhi,PLOT,,END_USE,,,THREE_TO_SIX,,,`

      const result = parseCsvContent(csvContent)
      
      expect(result.success).toBe(false)
      expect(result.totalRows).toBe(2)
      expect(result.validRows).toBe(1)
      expect(result.invalidRows).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors?.[0].row).toBe(1)
      expect(result.errors?.[0].errors[0]).toContain('Invalid email address')
    })

    it('should handle empty CSV', () => {
      const result = parseCsvContent('')
      
      expect(result.success).toBe(false)
      expect(result.errors?.[0].errors[0]).toContain('CSV file is empty')
    })

    it('should handle CSV with missing headers', () => {
      const csvContent = `fullName,email,city,propertyType,purpose,timeline
John Doe,john@example.com,Mumbai,APARTMENT,INVESTMENT,IMMEDIATE`

      const result = parseCsvContent(csvContent)
      
      expect(result.success).toBe(false)
      expect(result.errors?.[0].errors[0]).toContain('Missing required column')
    })

    it('should handle CSV with quoted fields', () => {
      const csvContent = `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
"John Doe","john@example.com","+1234567890","Mumbai","APARTMENT","2","INVESTMENT","5000000","8000000","IMMEDIATE","Website","Interested in 2BHK, premium location","premium,urgent"`

      const result = parseCsvContent(csvContent)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      
      if (result.data) {
        expect(result.data[0].fullName).toBe('John Doe')
        expect(result.data[0].notes).toBe('Interested in 2BHK, premium location')
        expect(result.data[0].tags).toBe('premium,urgent')
      }
    })

    it('should handle CSV with escaped quotes', () => {
      const csvContent = `fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
"John ""The Buyer"" Doe","john@example.com","+1234567890","Mumbai","APARTMENT","2","INVESTMENT","5000000","8000000","IMMEDIATE","Website","Interested in 2BHK","premium"`

      const result = parseCsvContent(csvContent)
      
      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      
      if (result.data) {
        expect(result.data[0].fullName).toBe('John "The Buyer" Doe')
      }
    })
  })
})
