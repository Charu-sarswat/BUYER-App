import { CsvRowSchema, type CsvRowInput } from './schemas'

export interface CsvImportResult {
  success: boolean
  data?: CsvRowInput[]
  errors?: Array<{
    row: number
    errors: string[]
  }>
  totalRows: number
  validRows: number
  invalidRows: number
}

export function parseCsvContent(csvContent: string): CsvImportResult {
  const lines = csvContent.trim().split('\n')
  
  if (lines.length === 0) {
    return {
      success: false,
      errors: [{ row: 0, errors: ['CSV file is empty'] }],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
    }
  }

  // Parse header row
  const headers = parseCsvLine(lines[0])
  const expectedHeaders = [
    'fullName', 'email', 'phone', 'city', 'propertyType', 
    'bhk', 'purpose', 'budgetMin', 'budgetMax', 'timeline', 
    'source', 'notes', 'tags', 'status'
  ]

  // Validate headers
  const headerErrors: string[] = []
  for (const expected of expectedHeaders) {
    if (!headers.includes(expected)) {
      headerErrors.push(`Missing required column: ${expected}`)
    }
  }

  if (headerErrors.length > 0) {
    return {
      success: false,
      errors: [{ row: 0, errors: headerErrors }],
      totalRows: lines.length - 1,
      validRows: 0,
      invalidRows: 0,
    }
  }

  const validData: CsvRowInput[] = []
  const errors: Array<{ row: number; errors: string[] }> = []

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const values = parseCsvLine(line)
    
    // Create object from headers and values
    const rowData: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      rowData[headers[j]] = values[j] || ''
    }

    // Validate with Zod schema
    const result = CsvRowSchema.safeParse(rowData)
    
    if (result.success) {
      validData.push(result.data)
    } else {
      errors.push({
        row: i,
        errors: result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      })
    }
  }

  return {
    success: errors.length === 0,
    data: validData,
    errors: errors.length > 0 ? errors : undefined,
    totalRows: lines.length - 1,
    validRows: validData.length,
    invalidRows: errors.length,
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i += 2
        continue
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
    i++
  }

  // Add the last field
  result.push(current.trim())

  return result
}

export function generateCsvContent(data: any[]): string {
  if (data.length === 0) {
    return ''
  }

  const headers = [
    'fullName', 'email', 'phone', 'city', 'propertyType', 
    'bhk', 'purpose', 'budgetMin', 'budgetMax', 'timeline', 
    'source', 'notes', 'tags', 'status', 'createdAt', 'updatedAt'
  ]

  const csvLines = [headers.join(',')]

  for (const row of data) {
    const values = headers.map(header => {
      let value = row[header]
      if (value === null || value === undefined) {
        return ''
      }
      
      // Transform database enum values back to CSV format
      if (header === 'bhk') {
        switch (value) {
          case 'ONE': value = '1'; break
          case 'TWO': value = '2'; break
          case 'THREE': value = '3'; break
          case 'FOUR': value = '4'; break
          case 'Studio': value = 'Studio'; break
          default: value = String(value)
        }
      } else if (header === 'timeline') {
        switch (value) {
          case 'ZERO_TO_THREE_MONTHS': value = '0-3m'; break
          case 'THREE_TO_SIX_MONTHS': value = '3-6m'; break
          case 'MORE_THAN_SIX_MONTHS': value = '>6m'; break
          case 'Exploring': value = 'Exploring'; break
          default: value = String(value)
        }
      } else if (header === 'source') {
        switch (value) {
          case 'Walk_in': value = 'Walk-in'; break
          default: value = String(value)
        }
      } else if (header === 'status') {
        switch (value) {
          case 'New': value = 'New'; break
          case 'Contacted': value = 'Contacted'; break
          case 'Qualified': value = 'Qualified'; break
          case 'Visited': value = 'Visited'; break
          case 'Negotiation': value = 'Negotiation'; break
          case 'Converted': value = 'Converted'; break
          case 'Dropped': value = 'Dropped'; break
          default: value = String(value)
        }
      }
      
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const stringValue = String(value)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      
      return stringValue
    })
    
    csvLines.push(values.join(','))
  }

  return csvLines.join('\n')
}
