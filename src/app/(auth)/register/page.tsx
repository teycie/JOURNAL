import { signup } from '../actions'
import Link from 'next/link'
import { Flower2 } from 'lucide-react'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mb-4">
            <Flower2 size={24} />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-center">Join Bloomly</h1>
          <p className="text-gray-500 mt-2 text-center">Start capturing your meaningful moments.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="name">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all bg-white/50"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all bg-white/50"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all bg-white/50"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-secondary-500 text-sm mt-2">{error}</div>}
          {message && <div className="text-primary-600 text-sm mt-2">{message}</div>}
          <button formAction={signup} className="w-full btn-primary mt-6">
            Sign Up
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
