'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, formatPropertyType, formatTimeline, formatPurpose, formatStatus } from '@/lib/utils'
import { debounce } from '@/lib/utils'
import { Plus, Download, Upload, Search } from 'lucide-react'

interface Buyer {
  id: string
  fullName: string
  email: string
  phone?: string
  city: string
  propertyType: string
  bhk?: number
  purpose: string
  budgetMin?: number
  budgetMax?: number
  timeline: string
  source?: string
  status: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name?: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export function BuyersList() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [city, setCity] = useState(searchParams.get('city') || 'all')
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || 'all')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [timeline, setTimeline] = useState(searchParams.get('timeline') || 'all')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    setSearch(value)
    setPage(1)
  }, 300)

  const fetchBuyers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(city && city !== 'all' && { city }),
        ...(propertyType && propertyType !== 'all' && { propertyType }),
        ...(status && status !== 'all' && { status }),
        ...(timeline && timeline !== 'all' && { timeline }),
      })

      const response = await fetch(`/api/buyers?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch buyers')
      }

      const data = await response.json()
      setBuyers(data.buyers)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuyers()
  }, [page, search, city, propertyType, status, timeline])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (city && city !== 'all') params.set('city', city)
    if (propertyType && propertyType !== 'all') params.set('propertyType', propertyType)
    if (status && status !== 'all') params.set('status', status)
    if (timeline && timeline !== 'all') params.set('timeline', timeline)
    if (page > 1) params.set('page', page.toString())

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/buyers${newUrl}`, { scroll: false })
  }, [search, city, propertyType, status, timeline, page, router])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(city && city !== 'all' && { city }),
        ...(propertyType && propertyType !== 'all' && { propertyType }),
        ...(status && status !== 'all' && { status }),
        ...(timeline && timeline !== 'all' && { timeline }),
      })

      const response = await fetch(`/api/buyers/export?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to export buyers')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/buyers/import', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Import failed')
        }

        // Refresh the list
        fetchBuyers()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed')
      }
    }
    input.click()
  }

  const clearFilters = () => {
    setSearch('')
    setCity('all')
    setPropertyType('all')
    setStatus('all')
    setTimeline('all')
    setPage(1)
  }

  if (loading && buyers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading buyers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Buyer Leads
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage and track your buyer leads efficiently
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleImport} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => router.push('/buyers/new')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Buyer
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter and search through your buyer leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
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

            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Apartment">Apartment</SelectItem>
                <SelectItem value="Villa">Villa</SelectItem>
                <SelectItem value="Plot">Plot</SelectItem>
                <SelectItem value="Office">Office</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
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

            <Select value={timeline} onValueChange={setTimeline}>
              <SelectTrigger>
                <SelectValue placeholder="Timeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timelines</SelectItem>
                <SelectItem value="ZERO_TO_THREE_MONTHS">0-3 months</SelectItem>
                <SelectItem value="THREE_TO_SIX_MONTHS">3-6 months</SelectItem>
                <SelectItem value="MORE_THAN_SIX_MONTHS">&gt;6 months</SelectItem>
                <SelectItem value="Exploring">Exploring</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={clearFilters} variant="outline" className="hover:bg-muted">
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-scale-in">
        <CardContent className="p-0">
          {buyers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No buyers found</h3>
              <p className="text-muted-foreground mb-6">Get started by creating your first buyer lead</p>
              <Button 
                onClick={() => router.push('/buyers/new')} 
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first buyer
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border shadow-professional">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-muted/50 to-muted/30">
                    <TableHead className="font-semibold text-foreground">Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                    <TableHead className="font-semibold text-foreground">Phone</TableHead>
                    <TableHead className="font-semibold text-foreground">City</TableHead>
                    <TableHead className="font-semibold text-foreground">Property</TableHead>
                    <TableHead className="font-semibold text-foreground">Purpose</TableHead>
                    <TableHead className="font-semibold text-foreground">Budget</TableHead>
                    <TableHead className="font-semibold text-foreground">Timeline</TableHead>
                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Updated</TableHead>
                    <TableHead className="font-semibold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyers.map((buyer, index) => (
                    <TableRow key={buyer.id}>
                      <TableCell className="font-semibold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary font-bold text-xs">
                              {buyer.fullName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {buyer.fullName}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{buyer.email}</TableCell>
                      <TableCell className="text-foreground font-medium">{buyer.phone || '-'}</TableCell>
                      <TableCell className="text-foreground font-medium">{buyer.city}</TableCell>
                      <TableCell className="text-foreground font-medium">
                        <div className="flex flex-col">
                          <span>{formatPropertyType(buyer.propertyType)}</span>
                          {buyer.bhk && <span className="text-xs text-muted-foreground">({buyer.bhk} BHK)</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{formatPurpose(buyer.purpose)}</TableCell>
                      <TableCell className="text-foreground font-medium">
                        <div className="flex flex-col">
                          {buyer.budgetMin && buyer.budgetMax
                            ? <span>{formatCurrency(buyer.budgetMin)} - {formatCurrency(buyer.budgetMax)}</span>
                            : buyer.budgetMin
                            ? <span>Min: {formatCurrency(buyer.budgetMin)}</span>
                            : buyer.budgetMax
                            ? <span>Max: {formatCurrency(buyer.budgetMax)}</span>
                            : <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground font-medium">{formatTimeline(buyer.timeline)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border shadow-sm ${
                          buyer.status === 'New' ? 'status-new' :
                          buyer.status === 'Contacted' ? 'status-contacted' :
                          buyer.status === 'Qualified' ? 'status-qualified' :
                          buyer.status === 'Visited' ? 'status-visited' :
                          buyer.status === 'Negotiation' ? 'status-negotiation' :
                          buyer.status === 'Converted' ? 'status-converted' :
                          buyer.status === 'Dropped' ? 'status-dropped' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {formatStatus(buyer.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-medium">
                        {formatDate(buyer.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => router.push(`/buyers/${buyer.id}`)}
                          className="bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 transition-all duration-200"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Card className="animate-slide-up">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">📄</span>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  Showing <span className="font-semibold text-foreground">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-semibold text-foreground">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                  <span className="font-semibold text-foreground">{pagination.total}</span> results
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                  className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page</span>
                  <span className="px-3 py-1 bg-primary/10 text-primary font-semibold rounded-lg">
                    {pagination.page}
                  </span>
                  <span className="text-sm text-muted-foreground">of {pagination.totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                  className="hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
