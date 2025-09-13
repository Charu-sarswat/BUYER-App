'use client'

import { useState, useEffect, useCallback } from 'react'
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

  const fetchMyBuyers = useCallback(async () => {
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
  }, [userId])

  useEffect(() => {
    fetchMyBuyers()
  }, [fetchMyBuyers])

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
      case 'Contacted': return 'bg-blue-100 text-blue-800'
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
    return <ErrorMessage error={error} />
  }

  if (buyers.length === 0) {
    return (
      <EmptyState
        title="No buyers yet"
        description="You haven't added any buyer leads yet. Start by adding your first buyer."
        actionLabel="Add First Buyer"
        onAction={() => window.location.href = '/buyers/new'}
      />
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          My Buyers
        </h1>
        <p className="text-muted-foreground text-lg">
          View and manage your personal buyer leads
        </p>
      </div>

      {/* Filters */}
      <Card className="animate-slide-up shadow-professional">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <Filter className="h-4 w-4 text-primary" />
            </div>
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter and search through your buyer leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="animate-scale-in hover:shadow-professional-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {buyers.length}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Total Buyers</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-blue-600 font-bold text-lg">👥</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-scale-in hover:shadow-professional-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {buyers.filter(b => b.status === 'New').length}
                </div>
                <p className="text-sm text-muted-foreground font-medium">New</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-blue-600 font-bold text-lg">🆕</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-scale-in hover:shadow-professional-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {buyers.filter(b => b.status === 'Converted').length}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Converted</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-blue-600 font-bold text-lg">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-scale-in hover:shadow-professional-lg transition-all duration-200 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                  {buyers.filter(b => b.status === 'Negotiation').length}
                </div>
                <p className="text-sm text-muted-foreground font-medium">In Negotiation</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-blue-600 font-bold text-lg">💼</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buyers List */}
      <div className="grid gap-6">
        {filteredBuyers.map((buyer, index) => (
          <Card key={buyer.id} className="animate-slide-up hover:shadow-professional-lg transition-all duration-200 group" style={{ animationDelay: `${index * 100}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {buyer.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {buyer.fullName}
                      </h3>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        buyer.status === 'New' ? 'status-new' :
                        buyer.status === 'Contacted' ? 'status-contacted' :
                        buyer.status === 'Qualified' ? 'status-qualified' :
                        buyer.status === 'Visited' ? 'status-visited' :
                        buyer.status === 'Negotiation' ? 'status-negotiation' :
                        buyer.status === 'Converted' ? 'status-converted' :
                        buyer.status === 'Dropped' ? 'status-dropped' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {buyer.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="space-y-1">
                      <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Contact</span>
                      <div className="space-y-1">
                        {buyer.email && <div className="text-foreground font-medium">{buyer.email}</div>}
                        <div className="text-foreground font-medium">{buyer.phone}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Property</span>
                      <div className="space-y-1">
                        <div className="text-foreground font-medium">{buyer.propertyType} {buyer.bhk && `(${buyer.bhk} BHK)`}</div>
                        <div className="text-foreground font-medium">{buyer.city}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Budget</span>
                      <div className="space-y-1">
                        <div className="text-foreground font-medium">{formatBudget(buyer.budgetMin, buyer.budgetMax)}</div>
                        <div className="text-foreground font-medium capitalize">{buyer.purpose.toLowerCase()}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">Timeline</span>
                      <div className="space-y-1">
                        <div className="text-foreground font-medium capitalize">
                          {buyer.timeline.replace(/_/g, ' ').toLowerCase()}
                        </div>
                        {buyer.source && (
                          <div className="text-foreground font-medium capitalize">{buyer.source.toLowerCase()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {buyer.notes && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg border">
                      <span className="font-semibold text-sm text-foreground">Notes:</span>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{buyer.notes}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 ml-6">
                  <Link href={`/buyers/${buyer.id}`}>
                    <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all duration-200">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBuyers.length === 0 && buyers.length > 0 && (
        <Card className="animate-scale-in">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No buyers found</h3>
            <p className="text-muted-foreground mb-6">No buyers match your current filters.</p>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setCityFilter('all')
              }}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
