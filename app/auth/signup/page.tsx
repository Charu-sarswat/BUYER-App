import { SignUpForm } from '@/components/signup-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Buyer Lead Intake</h1>
          <p className="text-muted-foreground mt-2">
            Create an account to manage your buyer leads
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
