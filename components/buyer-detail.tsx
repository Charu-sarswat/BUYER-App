'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UpdateBuyerFormSchema, type UpdateBuyerFormInput } from '@/lib/schemas'
import { formatCurrency, formatDate, formatPropertyType, formatTimeline, formatPurpose, formatStatus } from '@/lib/utils'
import { Loader2, Edit, Save, X, Trash2 } from 'lucide-react'
import { BuyerHistory } from './buyer-history'

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
  notes?: string
  tags?: string
  status: string
  createdAt: string
  updatedAt: string
  owner: {
    id: string
    name?: string
    email: string
  }
  history: Array<{
    id: string
    field: string
    oldValue?: string
    newValue?: string
    changedBy: string
    createdAt: string
  }>
}

interface BuyerDetailProps {
  buyerId: string
}

export function BuyerDetail({ buyerId }: BuyerDetailProps) {
  const router = useRouter()
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    trigger,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<UpdateBuyerFormInput>({
    resolver: zodResolver(UpdateBuyerFormSchema),
    mode: 'all', // Validate on change, blur, and submit
    defaultValues: {
      id: '',
      updatedAt: '',
      propertyType: undefined,
      bhk: undefined,
      purpose: undefined,
      timeline: undefined,
      source: undefined,
      status: undefined,
    },
  })

  const propertyType = watch('propertyType')
  const bhk = watch('bhk')
  const purpose = watch('purpose')
  const timeline = watch('timeline')
  const source = watch('source')
  const status = watch('status')

  const fetchBuyer = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/buyers/${buyerId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Buyer not found')
        }
        throw new Error('Failed to fetch buyer')
      }

      const data = await response.json()
      setBuyer(data)
      
      // Transform Prisma enum values to form values for the form
      const formData = {
        ...data,
        id: data.id, // Ensure id is included
        updatedAt: data.updatedAt, // Ensure updatedAt is included
        timeline: data.timeline === 'ZERO_TO_THREE_MONTHS' ? '0-3m' :
                  data.timeline === 'THREE_TO_SIX_MONTHS' ? '3-6m' :
                  data.timeline === 'MORE_THAN_SIX_MONTHS' ? '&gt;6m' :
                  data.timeline === 'Exploring' ? 'Exploring' :
                  data.timeline,
        bhk: data.bhk === 'ONE' ? '1' :
             data.bhk === 'TWO' ? '2' :
             data.bhk === 'THREE' ? '3' :
             data.bhk === 'FOUR' ? '4' :
             data.bhk === 'Studio' ? 'Studio' :
             data.bhk || null, // Keep null values as null
        source: data.source === 'Walk_in' ? 'Walk-in' : data.source,
        status: data.status, // Status enum values are already correct
        tags: data.tags || '', // Convert null to empty string
      }
      
      reset(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuyer()
  }, [buyerId])


  const onSubmit = async (data: UpdateBuyerFormInput) => {
    if (!buyer) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          updatedAt: buyer.updatedAt, // Include for concurrency check
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update buyer')
      }

      const updatedBuyer = await response.json()
      setBuyer(updatedBuyer)
      setEditing(false)
      await fetchBuyer() // Refresh to get updated history
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!buyer || !confirm('Are you sure you want to delete this buyer?')) {
      return
    }

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete buyer')
      }

      router.push('/buyers')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading buyer...</p>
        </div>
      </div>
    )
  }

  if (error || !buyer) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error || 'Buyer not found'}</p>
          <Button onClick={() => router.push('/buyers')} className="mt-4">
            Back to Buyers
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {buyer.fullName}
          </h1>
          <p className="text-muted-foreground text-lg">
            Created {formatDate(buyer.createdAt)} • Last updated {formatDate(buyer.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {editing ? (
            <>
              <Button
                type="button"
                disabled={saving}
                size="sm"
                onClick={handleSubmit(onSubmit)}
                className="hover:shadow-lg"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button
                onClick={() => {
                  setEditing(false)
                  reset(buyer)
                }}
                variant="outline"
                size="sm"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                size="sm"
                className="hover:bg-primary hover:text-primary-foreground"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Details
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={saving}
                className="hover:shadow-lg hover:shadow-destructive/25"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive animate-scale-in">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">👤</span>
                </div>
                Buyer Information
              </CardTitle>
              <CardDescription>
                {editing ? 'Edit the buyer details below' : 'View buyer details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Hidden fields for form validation */}
                <input type="hidden" {...register('id')} />
                <input type="hidden" {...register('updatedAt')} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    {editing ? (
                      <Input
                        id="fullName"
                        {...register('fullName')}
                        aria-invalid={errors.fullName ? 'true' : 'false'}
                        aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
                    ) : (
                      <p className="text-sm">{buyer.fullName}</p>
                    )}
                    {errors.fullName && (
                      <p id="fullName-error" className="text-sm text-destructive" role="alert">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    {editing ? (
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                    ) : (
                      <p className="text-sm">{buyer.email}</p>
                    )}
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        {...register('phone')}
                        aria-invalid={errors.phone ? 'true' : 'false'}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                    ) : (
                      <p className="text-sm">{buyer.phone || '-'}</p>
                    )}
                    {errors.phone && (
                      <p id="phone-error" className="text-sm text-destructive" role="alert">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    {editing ? (
                      <Select
                        value={watch('city') || ''}
                        onValueChange={(value) => setValue('city', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select city" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Chandigarh">Chandigarh</SelectItem>
                          <SelectItem value="Mohali">Mohali</SelectItem>
                          <SelectItem value="Zirakpur">Zirakpur</SelectItem>
                          <SelectItem value="Panchkula">Panchkula</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{buyer.city}</p>
                    )}
                    {errors.city && (
                      <p id="city-error" className="text-sm text-destructive" role="alert">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Property Type</Label>
                    {editing ? (
                      <Select
                        value={propertyType || ''}
                        onValueChange={(value) => setValue('propertyType', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Apartment">Apartment</SelectItem>
                          <SelectItem value="Villa">Villa</SelectItem>
                          <SelectItem value="Plot">Plot</SelectItem>
                          <SelectItem value="Office">Office</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{formatPropertyType(buyer.propertyType)}</p>
                    )}
                    {errors.propertyType && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.propertyType.message}
                      </p>
                    )}
                  </div>

                  {buyer.bhk && (
                    <div className="space-y-2">
                      <Label htmlFor="bhk">BHK</Label>
                      {editing ? (
                        <Select
                          value={bhk || ''}
                          onValueChange={(value) => setValue('bhk', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select BHK" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 BHK</SelectItem>
                            <SelectItem value="2">2 BHK</SelectItem>
                            <SelectItem value="3">3 BHK</SelectItem>
                            <SelectItem value="4">4 BHK</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm">{buyer.bhk} BHK</p>
                      )}
                      {errors.bhk && (
                        <p className="text-sm text-destructive" role="alert">
                          {errors.bhk.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    {editing ? (
                      <Select
                        value={purpose || ''}
                        onValueChange={(value) => setValue('purpose', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select purpose" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Buy">Buy</SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{formatPurpose(buyer.purpose)}</p>
                    )}
                    {errors.purpose && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.purpose.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">Timeline</Label>
                    {editing ? (
                      <Select
                        value={timeline || ''}
                        onValueChange={(value) => setValue('timeline', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-3m">0-3 months</SelectItem>
                          <SelectItem value="3-6m">3-6 months</SelectItem>
                          <SelectItem value=">6m">&gt;6 months</SelectItem>
                          <SelectItem value="Exploring">Exploring</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm">{formatTimeline(buyer.timeline)}</p>
                    )}
                    {errors.timeline && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.timeline.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budgetMin">Min Budget</Label>
                    {editing ? (
                      <Input
                        id="budgetMin"
                        type="number"
                        {...register('budgetMin', { valueAsNumber: true })}
                        aria-invalid={errors.budgetMin ? 'true' : 'false'}
                        aria-describedby={errors.budgetMin ? 'budgetMin-error' : undefined}
                      />
                    ) : (
                      <p className="text-sm">
                        {buyer.budgetMin ? formatCurrency(buyer.budgetMin) : '-'}
                      </p>
                    )}
                    {errors.budgetMin && (
                      <p id="budgetMin-error" className="text-sm text-destructive" role="alert">
                        {errors.budgetMin.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budgetMax">Max Budget</Label>
                    {editing ? (
                      <Input
                        id="budgetMax"
                        type="number"
                        {...register('budgetMax', { valueAsNumber: true })}
                        aria-invalid={errors.budgetMax ? 'true' : 'false'}
                        aria-describedby={errors.budgetMax ? 'budgetMax-error' : undefined}
                      />
                    ) : (
                      <p className="text-sm">
                        {buyer.budgetMax ? formatCurrency(buyer.budgetMax) : '-'}
                      </p>
                    )}
                    {errors.budgetMax && (
                      <p id="budgetMax-error" className="text-sm text-destructive" role="alert">
                        {errors.budgetMax.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  {editing ? (
                    <Select
                      value={source || ''}
                      onValueChange={(value) => setValue('source', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Walk-in">Walk-in</SelectItem>
                        <SelectItem value="Call">Call</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">{buyer.source || '-'}</p>
                  )}
                  {errors.source && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.source.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  {editing ? (
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      rows={4}
                      aria-invalid={errors.notes ? 'true' : 'false'}
                      aria-describedby={errors.notes ? 'notes-error' : undefined}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{buyer.notes || '-'}</p>
                  )}
                  {errors.notes && (
                    <p id="notes-error" className="text-sm text-destructive" role="alert">
                      {errors.notes.message}
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-success/20 to-success/10 rounded-lg flex items-center justify-center">
                  <span className="text-success font-bold text-sm">📊</span>
                </div>
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Status</Label>
                {editing ? (
                  <Select
                    value={status || ''}
                    onValueChange={(value) => setValue('status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Visited">Visited</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Dropped">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
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
                    {formatStatus(buyer.status)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-info/20 to-info/10 rounded-lg flex items-center justify-center">
                  <span className="text-info font-bold text-sm">👨‍💼</span>
                </div>
                Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{buyer.owner.name || buyer.owner.email}</p>
                <p className="text-xs text-muted-foreground">{buyer.owner.email}</p>
              </div>
            </CardContent>
          </Card>

          {buyer.history.length > 0 && (
            <Card className="animate-scale-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-warning/20 to-warning/10 rounded-lg flex items-center justify-center">
                    <span className="text-warning font-bold text-sm">📝</span>
                  </div>
                  Recent Changes
                </CardTitle>
                <CardDescription>
                  Last 5 changes to this buyer
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {buyer.history.map((change) => (
                    <div key={change.id} className="border-l-2 border-muted pl-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{change.field}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(change.createdAt)}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {change.oldValue && (
                          <span className="line-through">{change.oldValue}</span>
                        )}
                        {change.oldValue && change.newValue && ' → '}
                        {change.newValue && (
                          <span className="font-medium">{change.newValue}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full History Component */}
          <BuyerHistory buyerId={buyerId} />
        </div>
      </div>
    </div>
  )
}
