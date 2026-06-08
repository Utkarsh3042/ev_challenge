import Link from 'next/link'
import { Button } from '../components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas p-4 text-center">
      <h1 className="text-6xl font-bold text-primary-600">404</h1>
      <h2 className="mt-4 text-2xl font-semibold text-secondary-900">Page not found</h2>
      <p className="mt-2 text-secondary-500">The page you're looking for doesn't exist or has been moved.</p>
      <div className="mt-8">
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    </div>
  )
}
