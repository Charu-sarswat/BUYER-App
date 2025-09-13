import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Verify that the user is requesting their own buyers
    if (userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch buyers for the authenticated user
    const buyers = await prisma.buyer.findMany({
      where: {
        ownerId: userId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        history: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5,
          select: {
            id: true,
            field: true,
            oldValue: true,
            newValue: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({
      buyers,
      count: buyers.length
    })

  } catch (error) {
    console.error('Error fetching user buyers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
