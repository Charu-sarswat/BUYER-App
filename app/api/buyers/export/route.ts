import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BuyersQuerySchema } from '@/lib/schemas'
import { generateCsvContent } from '@/lib/csv-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    // Filter out "all" values before validation
    const filteredQuery = Object.fromEntries(
      Object.entries(query).filter(([key, value]) => value !== 'all')
    )
    
    const validatedQuery = BuyersQuerySchema.parse(filteredQuery)
    const { search, city, propertyType, status, timeline, sortBy, sortOrder } = validatedQuery

    // Build where clause (same as GET /api/buyers)
    const where: any = {}
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (city) where.city = city
    if (propertyType) where.propertyType = propertyType
    if (status) where.status = status
    if (timeline) where.timeline = timeline

    // Get all buyers matching the filters (no pagination for export)
    const buyers = await prisma.buyer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: {
          select: { name: true, email: true }
        }
      }
    })

    // Transform data for CSV
    const csvData = buyers.map(buyer => ({
      ...buyer,
      ownerName: buyer.owner.name,
      ownerEmail: buyer.owner.email,
    }))

    const csvContent = generateCsvContent(csvData)
    
    const filename = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting buyers:', error)
    return NextResponse.json(
      { error: 'Failed to export buyers' },
      { status: 500 }
    )
  }
}
