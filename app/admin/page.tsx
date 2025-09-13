'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminPage() {
  const [migrationStatus, setMigrationStatus] = useState<string>('')
  const [seedingStatus, setSeedingStatus] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const runMigrations = async () => {
    setIsLoading(true)
    setMigrationStatus('Setting up database...')
    
    try {
      const response = await fetch('/api/setup-db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMigrationStatus(`✅ ${result.message}`)
      } else {
        setMigrationStatus(`❌ ${result.message}`)
      }
    } catch (error) {
      setMigrationStatus(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const seedDatabase = async () => {
    setIsLoading(true)
    setSeedingStatus('Seeding database...')
    
    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const result = await response.json()
      
      if (result.success) {
        setSeedingStatus(`✅ ${result.message}`)
      } else {
        setSeedingStatus(`❌ ${result.message}`)
      }
    } catch (error) {
      setSeedingStatus(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Database Setup</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Migrations</CardTitle>
            <CardDescription>
              Create the database tables (User, Buyer, BuyerHistory)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runMigrations} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Running...' : 'Run Migrations'}
            </Button>
            {migrationStatus && (
              <p className="mt-4 text-sm">{migrationStatus}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seed Database</CardTitle>
            <CardDescription>
              Create demo users (admin@buyerapp.com / demo@example.com)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={seedDatabase} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Seeding...' : 'Seed Database'}
            </Button>
            {seedingStatus && (
              <p className="mt-4 text-sm">{seedingStatus}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Database Status</CardTitle>
            <CardDescription>
              Check current database status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.open('/api/db-status', '_blank')}
              variant="secondary"
              className="w-full"
            >
              Check Status
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
