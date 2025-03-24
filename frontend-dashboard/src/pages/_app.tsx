import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "@/styles/globals.css";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { AUTH_CONFIG } from "@/utils/constants";
import { auth } from "@/services/auth-instance.service";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthIframe, setShowAuthIframe] = useState(false);
  const [authIframeSrc, setAuthIframeSrc] = useState("");
  const [authCheckAttempts, setAuthCheckAttempts] = useState(0);
  const [lastAuthCheck, setLastAuthCheck] = useState(0);

  useEffect(() => {
    const showLoginIframe = () => {
      if (typeof window !== "undefined") {
        const authServiceUrl =
          process.env.NEXT_PUBLIC_AUTH_INTERFACE_URL ?? "http://localhost:5173";
        const returnUrl = encodeURIComponent(window.location.href);
        setAuthIframeSrc(
          `${authServiceUrl}/login?returnUrl=${returnUrl}&theme=neobrutal`
        );
        setShowAuthIframe(true);
        setIsLoading(false);
      }
    };

    const checkAuth = async () => {
      const now = Date.now();
      const authCheckCooldown = 5000;

      if (now - lastAuthCheck < authCheckCooldown) {
        setIsLoading(false);
        return;
      }

      setLastAuthCheck(now);

      const isLocallyAuthenticated = auth.isAuthenticated();

      if (!isLocallyAuthenticated) {
        showLoginIframe();
        return;
      }

      setIsLoading(true);
      try {
        const isValid = await auth.validateSession();

        if (isValid) {
          setShowAuthIframe(false);
          setIsLoading(false);
          setAuthCheckAttempts(0);
        } else {
          if (authCheckAttempts < 2) {
            setAuthCheckAttempts((prev) => prev + 1);
            setTimeout(checkAuth, 2000);
          } else {
            showLoginIframe();
            setAuthCheckAttempts(0);
          }
        }
      } catch (error) {
        setShowAuthIframe(false);
        setIsLoading(false);
      }
    };

    checkAuth();

    const handleAuthChange = (event: Event) => {
      checkAuth();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (
        event.key === "auth_state_timestamp" ||
        event.key === AUTH_CONFIG.tokenKey ||
        event.key === AUTH_CONFIG.userKey ||
        event.key === "token" ||
        event.key === "user"
      ) {
        checkAuth();
      }
    };

    window.addEventListener("auth-state-changed", handleAuthChange);
    window.addEventListener("storage", handleStorageChange);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkAuth();
      }
    });

    return () => {
      window.removeEventListener("auth-state-changed", handleAuthChange);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", () => {});
    };
  }, [router, authCheckAttempts, lastAuthCheck]);

  if (showAuthIframe) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-md border-[3px] border-black shadow-neo w-full max-w-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold">Authentication Required</h2>
            <button
              onClick={() =>
                (window.location.href =
                  process.env.NEXT_PUBLIC_LANDING_URL ??
                  "http://localhost:4321")
              }
              className="text-black hover:text-primary"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <iframe
            title="Authentication"
            src={authIframeSrc}
            className="w-full h-[500px] border-0"
          />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="card-neo p-6">
          <p className="text-lg font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <main className={inter.className}>
        <Component {...pageProps} />
      </main>
    </QueryClientProvider>
  );
}
