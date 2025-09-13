import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const field = searchParams.get('field') // Optional filter by field

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      buyerId: params.id
    }
    
    if (field) {
      where.field = field
    }

    // Get history with pagination
    const [history, total] = await Promise.all([
      prisma.buyerHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: { fullName: true }
          }
        }
      }),
      prisma.buyerHistory.count({ where })
    ])

    return NextResponse.json({
      history,
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
    console.error('Error fetching buyer history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyer history' },
      { status: 500 }
    )
  }
}
