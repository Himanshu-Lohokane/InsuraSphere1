import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div
        className="relative isolate px-6 pt-14 lg:px-8"
        style={{
          backgroundImage: "url('/reve-image.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl" style={{ textShadow: "2px 2px 6px rgba(0, 0, 0, 0.8)" }}>
            Manage Your Insurance Policies with Ease
          </h1>
          <p className="mt-6 text-lg leading-8 text-white" style={{ textShadow: "1px 1px 4px rgba(0, 0, 0, 0.8)" }}>
            Get AI-powered recommendations, track claims, and manage all your insurance policies in one place.
            Stay protected with InsuraSphere.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/auth/signup"
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              style={{ boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)" }}
            >
              Get started
            </Link>
            <Link
              href="/features"
              className="text-sm font-semibold leading-6 text-white underline hover:text-gray-200"
            >
              Learn more <ArrowRightIcon className="inline-block h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gray-900 opacity-5"></div> {/* Dim color overlay */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">Everything you need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Comprehensive Insurance Management
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              From policy management to AI-powered recommendations, we've got you covered.
            </p>
          </div>
          <div className="mx-auto mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-x-3">
                  <feature.icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{feature.name}</h3>
                </div>
                <p className="mt-4 text-base text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    name: 'AI-Powered Recommendations',
    description: 'Get personalized insurance recommendations based on your profile and needs.',
    icon: ArrowRightIcon,
  },
  {
    name: 'Policy Management',
    description: 'Upload, track, and manage all your insurance policies in one place.',
    icon: ArrowRightIcon,
  },
  {
    name: 'Claims Tracking',
    description: 'Easily track and manage your insurance claims with real-time updates.',
    icon: ArrowRightIcon,
  },
];