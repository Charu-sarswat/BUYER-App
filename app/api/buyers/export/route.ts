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
      // For enum fields, we need to check if the search term matches any enum value
      const cityValues = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']
      const matchingCities = cityValues.filter(city => 
        city.toLowerCase().includes(search.toLowerCase())
      )
      
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        ...(matchingCities.length > 0 ? [{ city: { in: matchingCities } }] : []),
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
