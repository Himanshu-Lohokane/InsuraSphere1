'use client';

import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          {children}
        </div>
      </div>

      {/* Right side - Insurance Theme */}
      <div className="hidden lg:flex lg:flex-1 relative bg-gradient-to-br from-blue-600 to-indigo-900">
        <div className="absolute inset-0 pattern-grid opacity-10" />
        <div className="relative w-full flex flex-col items-center justify-center text-white p-12 space-y-8">
          <div className="w-32 h-32 relative">
            <Image
              src="/logo.png"
              alt="InsuraSphere Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Welcome to InsuraSphere</h2>
            <p className="text-lg text-blue-100 max-w-md">
              Your comprehensive insurance management platform powered by artificial intelligence
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-2">Smart Recommendations</h3>
              <p className="text-sm text-blue-100">AI-powered policy suggestions tailored to your needs</p>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/10 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
              <p className="text-sm text-blue-100">Effortlessly manage all your insurance policies in one place</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .pattern-grid {
          background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
} 