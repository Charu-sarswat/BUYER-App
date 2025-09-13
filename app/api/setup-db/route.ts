import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup...')
    
    // Connect to database
    await prisma.$connect()
    console.log('Connected to database')
    
    // Create tables using raw SQL (more reliable in serverless)
    const createTablesSQL = `
      -- Create User table
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT,
        "email" TEXT NOT NULL UNIQUE,
        "password" TEXT,
        "emailVerified" TIMESTAMP(3),
        "image" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'USER',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );

      -- Create Account table
      CREATE TABLE IF NOT EXISTS "Account" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "provider" TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        "refresh_token" TEXT,
        "access_token" TEXT,
        "expires_at" INTEGER,
        "token_type" TEXT,
        "scope" TEXT,
        "id_token" TEXT,
        "session_state" TEXT,
        CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
      );

      -- Create Session table
      CREATE TABLE IF NOT EXISTS "Session" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionToken" TEXT NOT NULL UNIQUE,
        "userId" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL
      );

      -- Create VerificationToken table
      CREATE TABLE IF NOT EXISTS "VerificationToken" (
        "identifier" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expires" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
      );

      -- Create Buyer table
      CREATE TABLE IF NOT EXISTS "Buyer" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "fullName" TEXT NOT NULL,
        "email" TEXT,
        "phone" TEXT NOT NULL,
        "city" "City" NOT NULL,
        "propertyType" "PropertyType" NOT NULL,
        "bhk" "BHK",
        "purpose" "Purpose" NOT NULL,
        "budgetMin" INTEGER,
        "budgetMax" INTEGER,
        "timeline" "Timeline" NOT NULL,
        "source" "Source",
        "notes" TEXT,
        "tags" TEXT,
        "status" "BuyerStatus" NOT NULL DEFAULT 'New',
        "ownerId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );

      -- Create BuyerHistory table
      CREATE TABLE IF NOT EXISTS "BuyerHistory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "buyerId" TEXT NOT NULL,
        "field" TEXT NOT NULL,
        "oldValue" TEXT,
        "newValue" TEXT,
        "changedBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Create enums
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "PropertyType" AS ENUM ('Apartment', 'Villa', 'Plot', 'Office', 'Retail');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "Purpose" AS ENUM ('Buy', 'Rent');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "Timeline" AS ENUM ('ZERO_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'MORE_THAN_SIX_MONTHS', 'Exploring');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "BuyerStatus" AS ENUM ('New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "City" AS ENUM ('Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "Source" AS ENUM ('Website', 'Referral', 'Walk_in', 'Call', 'Other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "BHK" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'Studio');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      -- Create indexes
      CREATE INDEX IF NOT EXISTS "Buyer_ownerId_idx" ON "Buyer"("ownerId");
      CREATE INDEX IF NOT EXISTS "Buyer_city_idx" ON "Buyer"("city");
      CREATE INDEX IF NOT EXISTS "Buyer_propertyType_idx" ON "Buyer"("propertyType");
      CREATE INDEX IF NOT EXISTS "Buyer_status_idx" ON "Buyer"("status");
      CREATE INDEX IF NOT EXISTS "Buyer_timeline_idx" ON "Buyer"("timeline");
      CREATE INDEX IF NOT EXISTS "Buyer_updatedAt_idx" ON "Buyer"("updatedAt");
      CREATE INDEX IF NOT EXISTS "BuyerHistory_buyerId_idx" ON "BuyerHistory"("buyerId");
      CREATE INDEX IF NOT EXISTS "BuyerHistory_createdAt_idx" ON "BuyerHistory"("createdAt");

      -- Create foreign key constraints
      ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "Buyer" ADD CONSTRAINT "Buyer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      ALTER TABLE "BuyerHistory" ADD CONSTRAINT "BuyerHistory_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Buyer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `
    
    // Execute the SQL
    await prisma.$executeRawUnsafe(createTablesSQL)
    console.log('Tables created successfully')
    
    // Test the tables
    const userCount = await prisma.user.count()
    const buyerCount = await prisma.buyer.count()
    
    await prisma.$disconnect()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      tables: {
        users: userCount,
        buyers: buyerCount
      }
    })
    
  } catch (error) {
    console.error('Database setup failed:', error)
    
    try {
      await prisma.$disconnect()
    } catch (disconnectError) {
      console.error('Failed to disconnect:', disconnectError)
    }
    
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
