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
      const value = row[header]
      if (value === null || value === undefined) {
        return ''
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
