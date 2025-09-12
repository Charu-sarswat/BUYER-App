import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UpdateBuyerSchema } from '@/lib/schemas'
import { getClientIdentifier, withRateLimit, updateRateLimiter } from '@/lib/rate-limiter'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buyer = await prisma.buyer.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        history: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            buyer: {
              select: { fullName: true }
            }
          }
        }
      }
    })

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    return NextResponse.json(buyer)
  } catch (error) {
    console.error('Error fetching buyer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyer' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const identifier = getClientIdentifier(request)
    const rateLimit = withRateLimit(updateRateLimiter, identifier)
    
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
    const validatedData = UpdateBuyerSchema.parse(body)

    // Check if buyer exists and user has permission
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, updatedAt: true }
    })

    if (!existingBuyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Check ownership (owner or admin can edit)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (existingBuyer.ownerId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Concurrency check
    if (body.updatedAt && new Date(body.updatedAt) < existingBuyer.updatedAt) {
      return NextResponse.json(
        { error: 'Buyer was modified by another user. Please refresh and try again.' },
        { status: 409 }
      )
    }

    // Get old values for history
    const oldBuyer = await prisma.buyer.findUnique({
      where: { id: params.id }
    })

    // Update buyer
    const updatedBuyer = await prisma.buyer.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Create history entries for changed fields
    if (oldBuyer) {
      const historyEntries = []
      for (const [key, newValue] of Object.entries(validatedData)) {
        const oldValue = oldBuyer[key as keyof typeof oldBuyer]
        if (oldValue !== newValue && key !== 'updatedAt') {
          historyEntries.push({
            buyerId: params.id,
            field: key,
            oldValue: oldValue ? String(oldValue) : null,
            newValue: newValue ? String(newValue) : null,
            changedBy: session.user.id,
          })
        }
      }

      if (historyEntries.length > 0) {
        await prisma.buyerHistory.createMany({
          data: historyEntries
        })
      }
    }

    return NextResponse.json(updatedBuyer)
  } catch (error) {
    console.error('Error updating buyer:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update buyer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if buyer exists and user has permission
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true }
    })

    if (!existingBuyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    // Check ownership (owner or admin can delete)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (existingBuyer.ownerId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.buyer.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Buyer deleted successfully' })
  } catch (error) {
    console.error('Error deleting buyer:', error)
    return NextResponse.json(
      { error: 'Failed to delete buyer' },
      { status: 500 }
    )
  }
}
