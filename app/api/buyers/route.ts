import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BuyersQuerySchema } from '@/lib/schemas'
import { getClientIdentifier, withRateLimit, createRateLimiter } from '@/lib/rate-limiter'

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
    const { page, limit, search, city, propertyType, status, timeline, sortBy, sortOrder } = validatedQuery

    const skip = (page - 1) * limit

    // Build where clause
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

    // Get buyers with pagination
    const [buyers, total] = await Promise.all([
      prisma.buyer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.buyer.count({ where })
    ])

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      }
    })
  } catch (error) {
    console.error('Error fetching buyers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimit = withRateLimit(createRateLimiter, identifier)
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    console.log('Form data received:', JSON.stringify(body, null, 2))
    const { CreateBuyerSchema } = await import('@/lib/schemas')
    
    const validatedData = CreateBuyerSchema.parse(body)

    const buyer = await prisma.buyer.create({
      data: {
        ...validatedData,
        ownerId: session.user.id,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(buyer, { status: 201 })
  } catch (error) {
    console.error('Error creating buyer:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create buyer' },
      { status: 500 }
    )
  }
}
