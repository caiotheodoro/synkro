import Link from 'next/link';
import Head from 'next/head';

export default function ServerErrorPage() {
  return (
    <>
      <Head>
        <title>Server Error - Synkro Dashboard</title>
        <meta name="description" content="Something went wrong on our servers" />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="card-neo p-8 max-w-md w-full text-center">
          <h1 className="text-6xl font-bold mb-4">500</h1>
          <h2 className="text-2xl font-bold mb-6">Server Error</h2>
          <p className="mb-8 text-gray-600">
            Something went wrong on our servers. We're working to fix the issue.
          </p>
          <Link href="/" className="btn btn-primary">
            Try Again
          </Link>
        </div>
      </div>
    </>
  );
} 