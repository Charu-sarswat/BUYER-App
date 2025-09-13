import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: []
  }

  // Check 1: Environment Variables
  const databaseUrl = process.env.DATABASE_URL
  const nextAuthSecret = process.env.NEXTAUTH_SECRET
  const nextAuthUrl = process.env.NEXTAUTH_URL

  diagnostics.checks.push({
    name: 'Environment Variables',
    status: 'checking',
    details: {
      DATABASE_URL: databaseUrl ? 'set' : 'missing',
      NEXTAUTH_SECRET: nextAuthSecret ? 'set' : 'missing',
      NEXTAUTH_URL: nextAuthUrl ? 'set' : 'missing'
    }
  })

  // Check 2: Database URL Format
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl)
      const isValidPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://')
      
      diagnostics.checks.push({
        name: 'Database URL Format',
        status: isValidPostgres ? 'pass' : 'fail',
        details: {
          protocol: url.protocol,
          host: url.hostname,
          port: url.port || '5432',
          database: url.pathname.substring(1),
          ssl: url.searchParams.get('sslmode') || 'not specified',
          isValidPostgres
        }
      })
    } catch (error) {
      diagnostics.checks.push({
        name: 'Database URL Format',
        status: 'fail',
        details: {
          error: 'Invalid URL format',
          url: databaseUrl.substring(0, 30) + '...'
        }
      })
    }
  }

  // Check 3: Prisma Client
  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    
    diagnostics.checks.push({
      name: 'Prisma Client',
      status: 'pass',
      details: {
        message: 'Prisma Client imported successfully'
      }
    })

    // Check 4: Database Connection
    try {
      await prisma.$connect()
      diagnostics.checks.push({
        name: 'Database Connection',
        status: 'pass',
        details: {
          message: 'Successfully connected to database'
        }
      })

      // Check 5: Database Tables
      try {
        const userCount = await prisma.user.count()
        const buyerCount = await prisma.buyer.count()
        
        diagnostics.checks.push({
          name: 'Database Tables',
          status: 'pass',
          details: {
            users: userCount,
            buyers: buyerCount,
            message: 'Tables exist and accessible'
          }
        })
      } catch (tableError) {
        diagnostics.checks.push({
          name: 'Database Tables',
          status: 'fail',
          details: {
            error: 'Tables do not exist or not accessible',
            message: tableError instanceof Error ? tableError.message : 'Unknown error'
          }
        })
      }

      await prisma.$disconnect()
    } catch (connectionError) {
      diagnostics.checks.push({
        name: 'Database Connection',
        status: 'fail',
        details: {
          error: 'Failed to connect to database',
          message: connectionError instanceof Error ? connectionError.message : 'Unknown error'
        }
      })
    }
  } catch (prismaError) {
    diagnostics.checks.push({
      name: 'Prisma Client',
      status: 'fail',
      details: {
        error: 'Failed to import Prisma Client',
        message: prismaError instanceof Error ? prismaError.message : 'Unknown error'
      }
    })
  }

  // Check 6: NextAuth Configuration
  const nextAuthChecks = []
  if (nextAuthSecret) {
    nextAuthChecks.push('NEXTAUTH_SECRET is set')
  } else {
    nextAuthChecks.push('NEXTAUTH_SECRET is missing')
  }
  
  if (nextAuthUrl) {
    nextAuthChecks.push('NEXTAUTH_URL is set')
  } else {
    nextAuthChecks.push('NEXTAUTH_URL is missing')
  }

  diagnostics.checks.push({
    name: 'NextAuth Configuration',
    status: nextAuthSecret && nextAuthUrl ? 'pass' : 'fail',
    details: {
      checks: nextAuthChecks
    }
  })

  // Overall Status
  const failedChecks = diagnostics.checks.filter(check => check.status === 'fail')
  const overallStatus = failedChecks.length === 0 ? 'healthy' : 'issues'

  return NextResponse.json({
    status: overallStatus,
    summary: {
      total: diagnostics.checks.length,
      passed: diagnostics.checks.filter(c => c.status === 'pass').length,
      failed: failedChecks.length
    },
    ...diagnostics
  })
}
