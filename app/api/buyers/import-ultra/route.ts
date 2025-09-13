import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsvContent } from '@/lib/csv-utils'
import { getClientIdentifier, withRateLimit, importRateLimiter } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    console.log('Ultra-fast Import API called')
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

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 })
    }

    const csvContent = await file.text()
    const parseResult = parseCsvContent(csvContent)

    if (!parseResult.success || !parseResult.data) {
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

    if (parseResult.data.length > 200) {
      return NextResponse.json(
        { error: 'Too many rows. Maximum 200 rows allowed.' },
        { status: 400 }
      )
    }

    console.log(`Starting ultra-fast import of ${parseResult.data.length} buyers...`)
    const startTime = Date.now()

    // Use raw SQL for maximum performance
    const values = parseResult.data.map((buyer, index) => {
      const id = `buyer_${Date.now()}_${index}`
      const now = new Date().toISOString()
      
      return `(
        '${id}',
        '${buyer.fullName.replace(/'/g, "''")}',
        ${buyer.email ? `'${buyer.email.replace(/'/g, "''")}'` : 'NULL'},
        '${buyer.phone}',
        '${buyer.city}',
        '${buyer.propertyType}',
        ${buyer.bhk ? `'${buyer.bhk}'` : 'NULL'},
        '${buyer.purpose}',
        ${buyer.budgetMin || 'NULL'},
        ${buyer.budgetMax || 'NULL'},
        '${buyer.timeline}',
        ${buyer.source ? `'${buyer.source}'` : 'NULL'},
        ${buyer.notes ? `'${buyer.notes.replace(/'/g, "''")}'` : 'NULL'},
        ${buyer.tags ? `'${buyer.tags.replace(/'/g, "''")}'` : 'NULL'},
        '${buyer.status || 'New'}',
        '${session.user.id}',
        '${now}',
        '${now}'
      )`
    }).join(',')

    const insertSQL = `
      INSERT INTO "Buyer" (
        "id", "fullName", "email", "phone", "city", "propertyType", 
        "bhk", "purpose", "budgetMin", "budgetMax", "timeline", 
        "source", "notes", "tags", "status", "ownerId", "createdAt", "updatedAt"
      ) VALUES ${values}
    `

    await prisma.$executeRawUnsafe(insertSQL)

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`Ultra-fast import completed in ${duration}ms.`)

    return NextResponse.json({
      message: 'Ultra-fast import successful',
      imported: parseResult.data.length,
      totalRows: parseResult.data.length,
      duration: `${duration}ms`,
      performance: {
        rowsPerSecond: Math.round((parseResult.data.length / duration) * 1000)
      }
    })
  } catch (error) {
    console.error('Error in ultra-fast import:', error)
    return NextResponse.json(
      { 
        error: 'Failed to import buyers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
