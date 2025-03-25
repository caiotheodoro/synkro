import { BaseService } from "./base.service";
import {
  IUser,
  IAuthConfig,
  ITokenValidationResponse,
} from "../models/interfaces/auth.interface";
import { AUTH_CONFIG } from "../utils/constants";
import { isServer, isTokenExpired, broadcastAuthEvent } from "../utils/helpers";

export class AuthService extends BaseService {
  private authCheckInterval: NodeJS.Timeout | null = null;
  private readonly config: IAuthConfig;

  constructor() {
    super({ baseUrl: AUTH_CONFIG.authServiceUrl });
    this.config = AUTH_CONFIG;

    if (!isServer) {
      this.startAuthCheck();
      this.setupMessageListener();
    }
  }

  private setupMessageListener(): void {
    window.addEventListener("message", this.handleAuthMessage.bind(this));
  }

  private handleAuthMessage(event: MessageEvent): void {
    const trustedOrigins = [
      this.config.authServiceUrl,
      this.config.authInterfaceUrl,
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

    if (!isTrusted) return;

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

  public redirectToLogin(): void {
    if (isServer) return;

    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${this.config.authInterfaceUrl}/login?returnUrl=${returnUrl}&theme=neobrutal`;
  }

  private startAuthCheck(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }

    const token = this.getToken();
    if (!token) return;

    setTimeout(() => {
      this.validateToken().catch(console.error);
    }, 1000);

    this.authCheckInterval = setInterval(() => {
      if (this.getToken()) {
        this.validateToken().catch(console.error);
      } else {
        this.stopAuthCheck();
      }
    }, 120000);
  }

  private stopAuthCheck(): void {
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  public async validateToken(): Promise<boolean> {
    if (isServer) return false;

    const token = this.getToken();
    if (!token || isTokenExpired(token)) {
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
      if (cachedResult === "true") return true;
      if (cachedResult === "false") return false;
    }

    try {
      const response = await this.post<ITokenValidationResponse>(
        "/api/auth/validate-token",
        { token }
      );

      localStorage.setItem("last_token_validation_time", now.toString());
      localStorage.setItem(
        "token_validation_result",
        response.data.isValid.toString()
      );

      if (!response.data.isValid) {
        this.clearAuth();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      return true;
    }
  }

  public isAuthenticated(): boolean {
    if (isServer) return false;
    return !!this.getToken();
  }

  public getToken(): string | null {
    if (isServer) return null;
    return localStorage.getItem(this.config.tokenKey);
  }

  public getUser(): IUser | null {
    if (isServer) return null;

    const userJson = localStorage.getItem(this.config.userKey);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }

  public setAuth(token: string, user: IUser): void {
    if (isServer) return;

    localStorage.setItem(this.config.tokenKey, token);
    localStorage.setItem(this.config.userKey, JSON.stringify(user));
    broadcastAuthEvent("AUTH_SUCCESS", { token, user });
  }

  public clearAuth(): void {
    if (isServer) return;

    localStorage.removeItem(this.config.tokenKey);
    localStorage.removeItem(this.config.userKey);
    localStorage.removeItem("last_token_validation_time");
    localStorage.removeItem("token_validation_result");

    broadcastAuthEvent("AUTH_LOGOUT", {});
  }

  public async logout(): Promise<void> {
    try {
      await this.post("/api/auth/logout");
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      this.clearAuth();
      this.redirectToLogin();
    }
  }
}
