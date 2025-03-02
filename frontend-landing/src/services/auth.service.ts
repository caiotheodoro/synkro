export interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

class AuthService {
  private readonly userKey =
    import.meta.env.PUBLIC_AUTH_USER_KEY || "synkro_user";
  private readonly tokenKey =
    import.meta.env.PUBLIC_AUTH_TOKEN_KEY || "synkro_token";
  private readonly authServiceUrl =
    import.meta.env.PUBLIC_AUTH_SERVICE_URL || "http://localhost:3000";
  private readonly authInterfaceUrl =
    import.meta.env.PUBLIC_AUTH_INTERFACE_URL || "http://localhost:5173";
  private authCheckInterval: number | null = null;
  private lastValidationTime = 0;
  private readonly VALIDATION_COOLDOWN = 2000;

  constructor() {
    if (typeof window !== "undefined") {
      this.startAuthCheck();
      window.addEventListener("storage", this.handleStorageEvent.bind(this));
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          this.validateToken(true);
        }
      });
    }
  }

  startAuthCheck(): void {
    if (typeof window === "undefined") return;

    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }

    this.validateToken(true);

    this.authCheckInterval = window.setInterval(() => {
      this.validateToken(true);
    }, 30000);
  }

  stopAuthCheck(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  handleStorageEvent(event: StorageEvent): void {
    if (
      event.key === "auth_state_timestamp" ||
      event.key === this.tokenKey ||
      event.key === this.userKey ||
      event.key === "token" ||
      event.key === "user"
    ) {
      this.validateToken(true);
    }
  }

  getUser(): User | null {
    const envUserJson = localStorage.getItem(this.userKey);
    const legacyUserJson = localStorage.getItem("user");
    const userJson = envUserJson ?? legacyUserJson;

    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    const envToken = localStorage.getItem(this.tokenKey);
    const legacyToken = localStorage.getItem("token");

    return envToken ?? legacyToken;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async validateToken(forceCheck = false): Promise<boolean> {
    const token = this.getToken();
    if (!token) {
      this.clearAuth();
      return false;
    }

    const now = Date.now();
    if (
      !forceCheck &&
      now - this.lastValidationTime < this.VALIDATION_COOLDOWN
    ) {
      return true;
    }

    this.lastValidationTime = now;

    try {
      const response = await fetch(
        `${this.authServiceUrl}/api/auth/validate-token`,
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

      if (!response.ok || !data.isValid) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  clearAuth(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.dispatchEvent(
      new CustomEvent("auth-state-changed", {
        detail: {
          isAuthenticated: false,
          user: null,
        },
      })
    );

    try {
      localStorage.setItem("auth_state_timestamp", Date.now().toString());
    } catch {}

    this.stopAuthCheck();
  }

  logout(): void {
    const token = this.getToken();

    if (token) {
      fetch(`${this.authServiceUrl}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({ token }),
      });
    }

    this.clearAuth();

    const logoutFrame = document.createElement("iframe");
    logoutFrame.style.display = "none";
    logoutFrame.src = `${this.authInterfaceUrl}/logout`;
    document.body.appendChild(logoutFrame);

    setTimeout(() => {
      document.body.removeChild(logoutFrame);
      window.location.href = "/";
    }, 500);
  }

  checkAuthToken(): Promise<boolean> {
    return this.validateToken(true);
  }
}

export const authService = new AuthService();
