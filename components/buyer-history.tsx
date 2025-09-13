'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HistoryEntry {
  id: string
  field: string
  oldValue?: string
  newValue?: string
  changedBy: string
  createdAt: string
  buyer: {
    fullName: string
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

interface BuyerHistoryProps {
  buyerId: string
}

export function BuyerHistory({ buyerId }: BuyerHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [fieldFilter, setFieldFilter] = useState<string>('all')

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(fieldFilter !== 'all' && { field: fieldFilter }),
      })

      const response = await fetch(`/api/buyers/${buyerId}/history?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch history')
      }

      const data = await response.json()
      setHistory(data.history)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [buyerId, page, fieldFilter])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const fieldOptions = [
    { value: 'all', label: 'All Fields' },
    { value: 'fullName', label: 'Full Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'city', label: 'City' },
    { value: 'propertyType', label: 'Property Type' },
    { value: 'bhk', label: 'BHK' },
    { value: 'purpose', label: 'Purpose' },
    { value: 'budgetMin', label: 'Min Budget' },
    { value: 'budgetMax', label: 'Max Budget' },
    { value: 'timeline', label: 'Timeline' },
    { value: 'source', label: 'Source' },
    { value: 'notes', label: 'Notes' },
    { value: 'tags', label: 'Tags' },
    { value: 'status', label: 'Status' },
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <CardDescription>Loading history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Change History</CardTitle>
          <CardDescription>Error loading history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchHistory} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change History</CardTitle>
        <CardDescription>
          Complete history of changes to this buyer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Select value={fieldFilter} onValueChange={setFieldFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by field" />
              </SelectTrigger>
              <SelectContent>
                {fieldOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* History List */}
          {history.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No history found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border-l-2 border-muted pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">
                      {entry.field.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.createdAt)}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {entry.oldValue && (
                      <span className="line-through bg-red-50 px-1 rounded">
                        {entry.oldValue}
                      </span>
                    )}
                    {entry.oldValue && entry.newValue && (
                      <span className="mx-2">→</span>
                    )}
                    {entry.newValue && (
                      <span className="font-medium bg-green-50 px-1 rounded">
                        {entry.newValue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} entries
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
