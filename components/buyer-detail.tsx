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
    formState: { errors, isValid, isDirty, isSubmitting },
  } = useForm<UpdateBuyerFormInput>({
    resolver: zodResolver(UpdateBuyerFormSchema),
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
      
      // Transform Prisma enum values to assignment values for the form
      const formData = {
        ...data,
        id: data.id, // Ensure id is included
        updatedAt: data.updatedAt, // Ensure updatedAt is included
        timeline: data.timeline === 'ZERO_TO_THREE_MONTHS' ? '0-3m' :
                  data.timeline === 'THREE_TO_SIX_MONTHS' ? '3-6m' :
                  data.timeline === 'MORE_THAN_SIX_MONTHS' ? '>6m' :
                  data.timeline,
        bhk: data.bhk === 'ONE' ? '1' :
             data.bhk === 'TWO' ? '2' :
             data.bhk === 'THREE' ? '3' :
             data.bhk === 'FOUR' ? '4' :
             data.bhk,
        source: data.source === 'Walk_in' ? 'Walk-in' : data.source,
        status: data.status === 'NEW' ? 'New' :
                data.status === 'CONTACTED' ? 'Contacted' :
                data.status === 'QUALIFIED' ? 'Qualified' :
                data.status === 'VISITED' ? 'Visited' :
                data.status === 'NEGOTIATION' ? 'Negotiation' :
                data.status === 'CONVERTED' ? 'Converted' :
                data.status === 'DROPPED' ? 'Dropped' :
                data.status,
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
    console.log('🚀 onSubmit called!')
    console.log('📊 Form data:', JSON.stringify(data, null, 2))
    console.log('🔍 Buyer exists:', !!buyer)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{buyer.fullName}</h1>
          <p className="text-muted-foreground">
            Created {formatDate(buyer.createdAt)} • Last updated {formatDate(buyer.updatedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                type="submit"
                disabled={saving}
                size="sm"
                onClick={(e) => {
                  console.log('🔘 Save button clicked!')
                  console.log('🔘 Button disabled?', saving)
                  console.log('🔘 Form errors:', errors)
                  console.log('🔘 Form valid?', isValid)
                }}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save
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
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                disabled={saving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Buyer Information</CardTitle>
              <CardDescription>
                {editing ? 'Edit the buyer details below' : 'View buyer details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                console.log('📝 Form submit event triggered!')
                console.log('📋 Form state:', { errors, isValid, isDirty, isSubmitting })
                e.preventDefault()
                console.log('🔄 Calling handleSubmit...')
                handleSubmit(onSubmit)(e)
              }} className="space-y-6">
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
                      <Input
                        id="city"
                        {...register('city')}
                        aria-invalid={errors.city ? 'true' : 'false'}
                        aria-describedby={errors.city ? 'city-error' : undefined}
                      />
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
                          <SelectItem value=">6m">>6 months</SelectItem>
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
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Current Status</Label>
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
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    buyer.status === 'New' ? 'bg-blue-100 text-blue-800' :
                    buyer.status === 'Contacted' ? 'bg-yellow-100 text-yellow-800' :
                    buyer.status === 'Qualified' ? 'bg-green-100 text-green-800' :
                    buyer.status === 'Visited' ? 'bg-purple-100 text-purple-800' :
                    buyer.status === 'Negotiation' ? 'bg-orange-100 text-orange-800' :
                    buyer.status === 'Converted' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {formatStatus(buyer.status)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{buyer.owner.name || buyer.owner.email}</p>
                <p className="text-xs text-muted-foreground">{buyer.owner.email}</p>
              </div>
            </CardContent>
          </Card>

          {buyer.history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Changes</CardTitle>
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
        </div>
      </div>
    </div>
  )
}
