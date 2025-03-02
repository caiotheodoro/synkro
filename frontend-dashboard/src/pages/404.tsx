import Link from 'next/link';
import Head from 'next/head';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page Not Found - Synkro Dashboard</title>
        <meta name="description" content="The page you're looking for doesn't exist" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="card-neo p-8 max-w-md w-full text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-6">Page Not Found</h2>
          <p className="mb-8 text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link href="/" className="btn btn-primary">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </>
  );
} 