import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database seeding...')
    
    // Check if users already exist
    const existingUsers = await prisma.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database already seeded',
        existingUsers 
      })
    }
    
    // Create demo users
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const demoPassword = await bcrypt.hash('demo123', 12)
    
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@buyerapp.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        password: demoPassword,
        role: 'USER'
      }
    })
    
    console.log('Demo users created successfully')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully',
      users: {
        admin: adminUser.email,
        demo: demoUser.email
      }
    })
    
  } catch (error) {
    console.error('Seeding failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Seeding failed', 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
