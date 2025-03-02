import { useEffect } from 'react';
import Head from 'next/head';
import { authService } from '@/services/auth.service';

export default function LoginPage() {

  /*
  useEffect(() => {
    if (authService.isAuthenticated()) {
      window.location.href = '/';
      return;
    }

    window.location.href = '/';
  }, []);*/

  return (
    <>
      <Head>
        <title>Login - Synkro Dashboard</title>
        <meta name="description" content="Login to access your Synkro Dashboard" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card-neo p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Redirecting to login...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    </>
  );
} 