import { NewBuyerForm } from '@/components/new-buyer-form'

export default function NewBuyerPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Buyer</h1>
        <p className="text-muted-foreground">
          Create a new buyer lead
        </p>
      </div>
      <NewBuyerForm />
    </div>
  )
}
