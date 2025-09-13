import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Check if tables exist and get counts
    const userCount = await prisma.user.count()
    const buyerCount = await prisma.buyer.count()
    const buyerHistoryCount = await prisma.buyerHistory.count()
    
    // Check if demo users exist
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@buyerapp.com' }
    })
    
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@example.com' }
    })
    
    await prisma.$disconnect()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      status: {
        connected: true,
        tables: {
          users: userCount,
          buyers: buyerCount,
          buyerHistory: buyerHistoryCount
        },
        demoUsers: {
          admin: adminUser ? 'exists' : 'missing',
          demo: demoUser ? 'exists' : 'missing'
        },
        databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
      }
    })
    
  } catch (error) {
    console.error('Database status check failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database connection failed', 
        status: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          databaseUrl: process.env.DATABASE_URL ? 'set' : 'missing'
        }
      },
      { status: 500 }
    )
  }
}
