import Link from "next/link";
import { Flower2, BookHeart, CalendarHeart, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-primary-600">
          <Flower2 className="w-8 h-8" />
          <span className="font-serif text-2xl font-bold text-foreground">Bloomly</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-foreground font-medium">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl glass-panel p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-primary-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 bg-secondary-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight relative z-10">
            A calm, premium space for your <span className="text-primary-600">thoughts.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto relative z-10">
            Bloomly is your digital sanctuary. Reflect on your day, track your mood, and cultivate a mindful journaling habit in a beautiful, distraction-free environment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link href="/register" className="btn-primary px-8 py-3 text-lg w-full sm:w-auto">
              Start Journaling
            </Link>
            <Link href="/login" className="btn-secondary px-8 py-3 text-lg w-full sm:w-auto">
              Welcome Back
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mt-24">
          <div className="flex flex-col items-center text-center p-6 glass-panel">
            <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4">
              <BookHeart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Themed Books</h3>
            <p className="text-gray-600">Organize your thoughts into customized, beautiful journal books.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 glass-panel">
            <div className="w-12 h-12 bg-secondary-50 text-secondary-500 rounded-xl flex items-center justify-center mb-4">
              <CalendarHeart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Daily Reflection</h3>
            <p className="text-gray-600">Track your mood, habits, and daily to-dos alongside your entries.</p>
          </div>
          <div className="flex flex-col items-center text-center p-6 glass-panel">
            <div className="w-12 h-12 bg-accent-50 text-accent-500 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Premium Design</h3>
            <p className="text-gray-600">Enjoy a calm, beautiful interface that inspires you to write.</p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Bloomly. All rights reserved.</p>
      </footer>
    </div>
  );
}
