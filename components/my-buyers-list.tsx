'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Buyer } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/loading-spinner'
import { EmptyState } from '@/components/empty-state'
import { ErrorMessage } from '@/components/error-message'
import { Eye, Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

interface MyBuyersListProps {
  userId: string
}

export function MyBuyersList({ userId }: MyBuyersListProps) {
  const { data: session } = useSession()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cityFilter, setCityFilter] = useState('all')

  useEffect(() => {
    fetchMyBuyers()
  }, [userId])

  const fetchMyBuyers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/buyers/my-buyers?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch buyers')
      }
      
      const data = await response.json()
      setBuyers(data.buyers || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = buyer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         buyer.phone.includes(searchTerm)
    
    const matchesStatus = statusFilter === 'all' || buyer.status === statusFilter
    const matchesCity = cityFilter === 'all' || buyer.city === cityFilter
    
    return matchesSearch && matchesStatus && matchesCity
  })

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Not specified'
    if (!min) return `Up to ₹${(max! / 100000).toFixed(1)}L`
    if (!max) return `₹${(min / 100000).toFixed(1)}L+`
    return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'Qualified': return 'bg-green-100 text-green-800'
      case 'Contacted': return 'bg-yellow-100 text-yellow-800'
      case 'Visited': return 'bg-purple-100 text-purple-800'
      case 'Negotiation': return 'bg-orange-100 text-orange-800'
      case 'Converted': return 'bg-emerald-100 text-emerald-800'
      case 'Dropped': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (buyers.length === 0) {
    return (
      <EmptyState
        title="No buyers yet"
        description="You haven't added any buyer leads yet. Start by adding your first buyer."
        action={
          <Link href="/buyers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add First Buyer
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter and search through your buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search buyers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Visited">Visited</SelectItem>
                <SelectItem value="Negotiation">Negotiation</SelectItem>
                <SelectItem value="Converted">Converted</SelectItem>
                <SelectItem value="Dropped">Dropped</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                <SelectItem value="Mohali">Mohali</SelectItem>
                <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                <SelectItem value="Panchkula">Panchkula</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{buyers.length}</div>
            <p className="text-sm text-muted-foreground">Total Buyers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {buyers.filter(b => b.status === 'New').length}
            </div>
            <p className="text-sm text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {buyers.filter(b => b.status === 'Converted').length}
            </div>
            <p className="text-sm text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {buyers.filter(b => b.status === 'Negotiation').length}
            </div>
            <p className="text-sm text-muted-foreground">In Negotiation</p>
          </CardContent>
        </Card>
      </div>

      {/* Buyers List */}
      <div className="grid gap-4">
        {filteredBuyers.map((buyer) => (
          <Card key={buyer.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{buyer.fullName}</h3>
                    <Badge className={getStatusColor(buyer.status)}>
                      {buyer.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Contact:</span><br />
                      {buyer.email && <div>{buyer.email}</div>}
                      <div>{buyer.phone}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Property:</span><br />
                      <div>{buyer.propertyType} {buyer.bhk && `(${buyer.bhk} BHK)`}</div>
                      <div>{buyer.city}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Budget:</span><br />
                      <div>{formatBudget(buyer.budgetMin, buyer.budgetMax)}</div>
                      <div className="capitalize">{buyer.purpose.toLowerCase()}</div>
                    </div>
                    
                    <div>
                      <span className="font-medium">Timeline:</span><br />
                      <div className="capitalize">
                        {buyer.timeline.replace(/_/g, ' ').toLowerCase()}
                      </div>
                      {buyer.source && (
                        <div className="capitalize">{buyer.source.toLowerCase()}</div>
                      )}
                    </div>
                  </div>
                  
                  {buyer.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <span className="font-medium text-sm">Notes:</span>
                      <p className="text-sm text-muted-foreground mt-1">{buyer.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Link href={`/buyers/${buyer.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBuyers.length === 0 && buyers.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No buyers match your current filters.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setCityFilter('all')
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
