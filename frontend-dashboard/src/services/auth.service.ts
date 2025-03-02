interface User {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

class AuthService {
  private readonly tokenKey =
    process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY ?? "synkro_token";
  private readonly userKey =
    process.env.NEXT_PUBLIC_AUTH_USER_KEY ?? "synkro_user";
  private authCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.startAuthCheck();

      this.setupMessageListener();
    }
  }

  setupMessageListener(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("message", this.handleAuthMessage.bind(this));
  }

  handleAuthMessage(event: MessageEvent): void {
    const trustedOrigins = [
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "http://localhost:3000",
      process.env.NEXT_PUBLIC_AUTH_INTERFACE_URL ?? "http://localhost:5173",
    ];

    const originUrl = new URL(event.origin);
    const isTrusted = trustedOrigins.some((trusted) => {
      try {
        const trustedUrl = new URL(trusted);
        return trustedUrl.hostname === originUrl.hostname;
      } catch (e) {
        return false;
      }
    });

    if (!isTrusted) {
      return;
    }

    if (
      event.data.type === "AUTH_SUCCESS" ||
      event.data.type === "AUTH_STATUS_AUTHENTICATED"
    ) {
      if (event.data.access_token && event.data.user) {
        this.setAuth(event.data.access_token, event.data.user);

        window.location.reload();
      } else if (
        event.data.type === "AUTH_STATUS_AUTHENTICATED" &&
        !this.isAuthenticated()
      ) {
        this.redirectToLogin();
      }
    } else if (
      event.data.type === "AUTH_LOGOUT" ||
      event.data.type === "LOGOUT_SUCCESS" ||
      event.data.type === "AUTH_STATUS_UNAUTHENTICATED"
    ) {
      this.clearAuth();
    }
  }

  redirectToLogin(): void {
    if (typeof window === "undefined") return;

    const authInterfaceUrl =
      process.env.NEXT_PUBLIC_AUTH_INTERFACE_URL ?? "http://localhost:5173";
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${authInterfaceUrl}/login?returnUrl=${returnUrl}&theme=neobrutal`;
  }

  startAuthCheck(): void {
    if (typeof window === "undefined") return;

    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }

    const token = this.getToken();
    if (!token) {
      return;
    }

    setTimeout(() => {
      this.validateToken().catch((err) => {
        console.error("Error in initial token validation:", err);
      });
    }, 1000);

    this.authCheckInterval = setInterval(() => {
      if (this.getToken()) {
        this.validateToken().catch((err) => {
          console.error("Error in periodic token validation:", err);
        });
      } else {
        this.stopAuthCheck();
      }
    }, 120000);
  }

  stopAuthCheck(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  async validateToken(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    const token = this.getToken();
    if (!token) {
      this.clearAuth();
      return false;
    }

    if (this.isTokenExpired()) {
      this.clearAuth();
      return false;
    }

    const lastValidationTime = localStorage.getItem(
      "last_token_validation_time"
    );
    const now = Date.now();
    const validationCooldown = 10000;

    if (
      lastValidationTime &&
      now - parseInt(lastValidationTime) < validationCooldown
    ) {
      const cachedResult = localStorage.getItem("token_validation_result");
      if (cachedResult === "true") {
        return true;
      } else if (cachedResult === "false") {
        return false;
      }
    }

    try {
      const authServiceUrl =
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "http://localhost:3000";

      const response = await fetch(
        `${authServiceUrl}/api/auth/validate-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      localStorage.setItem("last_token_validation_time", now.toString());
      localStorage.setItem("token_validation_result", data.isValid.toString());

      if (!response.ok || !data.isValid) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      return true;
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;

    const envToken = localStorage.getItem(this.tokenKey);
    const legacyToken = localStorage.getItem("token");

    return !!(envToken ?? legacyToken);
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null;

    const envToken = localStorage.getItem(this.tokenKey);
    const legacyToken = localStorage.getItem("token");

    return envToken ?? legacyToken;
  }

  getUser(): User | null {
    if (typeof window === "undefined") return null;

    const envUserJson = localStorage.getItem(this.userKey);
    const legacyUserJson = localStorage.getItem("user");
    const userJson = envUserJson ?? legacyUserJson;

    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));

      if (!payload.exp) return false;

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch (error) {
      console.error("Error checking token expiration:", error);
      return true;
    }
  }

  setAuth(token: string, user: User): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    this.notifyAuthChange();

    this.broadcastAuthEvent("LOGIN_SUCCESS", { user });
    this.broadcastAuthEvent("AUTH_STATUS_AUTHENTICATED", { user });

    this.startAuthCheck();
  }

  clearAuth(): void {
    if (typeof window === "undefined") return;

    const user = this.getUser();
    this.broadcastAuthEvent("LOGOUT_SUCCESS", { user });
    this.broadcastAuthEvent("AUTH_STATUS_UNAUTHENTICATED", { user });

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    this.notifyAuthChange();
  }

  logout(): void {
    if (typeof window === "undefined") return;

    const token = this.getToken();

    if (token) {
      const authServiceUrl =
        process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "http://localhost:3000";

      fetch(`${authServiceUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })
        .then((response) => response.json())
        .catch((err) => console.error("Error calling logout API:", err));
    }

    const authInterfaceUrl =
      process.env.NEXT_PUBLIC_AUTH_INTERFACE_URL ?? "http://localhost:5173";
    const logoutFrame = document.createElement("iframe");
    logoutFrame.style.display = "none";
    logoutFrame.src = `${authInterfaceUrl}/logout`;
    document.body.appendChild(logoutFrame);

    setTimeout(() => {
      document.body.removeChild(logoutFrame);

      this.clearAuth();

      this.stopAuthCheck();

      window.location.href =
        process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:4321";
    }, 500);
  }

  private notifyAuthChange(): void {
    if (typeof window === "undefined") return;

    const event = new CustomEvent("auth-state-changed", {
      detail: {
        isAuthenticated: this.isAuthenticated(),
        user: this.getUser(),
      },
    });
    window.dispatchEvent(event);

    try {
      localStorage.setItem("auth_state_timestamp", Date.now().toString());
    } catch (e) {
      console.error("Error setting auth state timestamp:", e);
    }
  }

  private broadcastAuthEvent(type: string, data: any): void {
    if (typeof window === "undefined") return;

    try {
      const landingUrl =
        process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:4321";

      const eventData = { type, ...data };

      if (type === "LOGOUT_SUCCESS" || type === "AUTH_STATUS_UNAUTHENTICATED") {
        eventData.user = null;
        eventData.access_token = "";
      }

      if (window.opener) {
        window.opener.postMessage(eventData, landingUrl);
      }

      if (window.parent && window.parent !== window) {
        window.parent.postMessage(eventData, landingUrl);
      }

      try {
        localStorage.setItem(
          "auth_broadcast_event",
          JSON.stringify({
            ...eventData,
            timestamp: Date.now(),
          })
        );
      } catch (e) {
        console.error("Error broadcasting auth event via localStorage:", e);
      }
    } catch (error) {
      console.error("Error broadcasting auth event:", error);
    }
  }
}

export const authService = new AuthService();
