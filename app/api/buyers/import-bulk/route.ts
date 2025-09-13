import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsvContent } from '@/lib/csv-utils'
import { getClientIdentifier, withRateLimit, importRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    console.log('Bulk Import API called')
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.log('Unauthorized access to import API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimit = withRateLimit(importRateLimiter, identifier)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    console.log('File received:', file ? { name: file.name, size: file.size, type: file.type } : 'No file')

    if (!file) {
      console.log('No file provided in import request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit for bulk import
      return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    const csvContent = await file.text()
    console.log('CSV content length:', csvContent.length)
    
    const parseResult = parseCsvContent(csvContent)
    console.log('Parse result:', { 
      success: parseResult.success, 
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      invalidRows: parseResult.invalidRows,
      errors: parseResult.errors?.length || 0
    })

    if (!parseResult.success) {
      console.log('CSV validation failed:', parseResult.errors)
      return NextResponse.json({
        error: 'CSV validation failed',
        details: parseResult.errors,
        summary: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          invalidRows: parseResult.invalidRows,
        }
      }, { status: 400 })
    }

    // If no valid data, return validation errors
    if (!parseResult.data || parseResult.data.length === 0) {
      return NextResponse.json({
        error: 'No valid rows to import',
        details: parseResult.errors,
        summary: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          invalidRows: parseResult.invalidRows,
        }
      }, { status: 400 })
    }

    if (parseResult.data.length > 200) {
      return NextResponse.json(
        { error: 'Too many rows. Maximum 200 rows allowed.' },
        { status: 400 }
      )
    }

    // Prepare data for bulk insert
    const buyersData = parseResult.data.map(buyerData => ({
      ...buyerData,
      ownerId: session.user.id,
    }))

    console.log(`Starting bulk import of ${buyersData.length} valid buyers...`)
    const startTime = Date.now()

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Use createMany for maximum performance
      const createResult = await tx.buyer.createMany({
        data: buyersData,
        skipDuplicates: true, // Skip duplicates if any
      })

      return createResult
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`Bulk import completed in ${duration}ms. Created ${result.count} buyers.`)

    // Return detailed response
    return NextResponse.json({
      message: 'Bulk import successful',
      imported: result.count,
      totalRows: parseResult.totalRows,
      validRows: parseResult.validRows,
      invalidRows: parseResult.invalidRows,
      skipped: parseResult.validRows - result.count,
      duration: `${duration}ms`,
      performance: {
        rowsPerSecond: Math.round((result.count / duration) * 1000)
      },
      summary: {
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        invalidRows: parseResult.invalidRows,
        imported: result.count,
        skipped: parseResult.validRows - result.count
      }
    })
  } catch (error) {
    console.error('Error in bulk import:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import buyers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
