import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup...')
    
    // Use prisma db push instead of migrate deploy for serverless
    execSync('npx prisma db push', { 
      stdio: 'inherit',
      env: { ...process.env }
    })
    
    console.log('Database schema pushed successfully')
    
    // Test database connection
    await prisma.$connect()
    console.log('Database connection successful')
    
    // Check if tables exist
    const userCount = await prisma.user.count()
    console.log(`Users table exists with ${userCount} records`)
    
    await prisma.$disconnect()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database schema created successfully',
      userCount 
    })
    
  } catch (error) {
    console.error('Database setup failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database setup failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Check if tables exist
    const userCount = await prisma.user.count()
    const buyerCount = await prisma.buyer.count()
    
    await prisma.$disconnect()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tables: {
        users: userCount,
        buyers: buyerCount
      }
    })
    
  } catch (error) {
    console.error('Database connection test failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Database connection failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
