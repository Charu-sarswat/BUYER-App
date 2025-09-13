import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is set
    const databaseUrl = process.env.DATABASE_URL
    
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable is not set',
        environment: process.env.NODE_ENV
      }, { status: 500 })
    }
    
    // Check if it's a valid PostgreSQL URL
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL is not a valid PostgreSQL connection string',
        url: databaseUrl.substring(0, 20) + '...' // Show first 20 chars for debugging
      }, { status: 500 })
    }
    
    // Try to parse the connection string
    try {
      const url = new URL(databaseUrl)
      const host = url.hostname
      const port = url.port || '5432'
      const database = url.pathname.substring(1) // Remove leading slash
      
      return NextResponse.json({
        success: true,
        message: 'DATABASE_URL is properly formatted',
        details: {
          host: host,
          port: port,
          database: database,
          ssl: url.searchParams.get('sslmode') || 'not specified',
          environment: process.env.NODE_ENV
        }
      })
    } catch (urlError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid URL format in DATABASE_URL',
        url: databaseUrl.substring(0, 20) + '...'
      }, { status: 500 })
    }
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
