import axios from "axios";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from "@/types/auth.types";

export class AuthService {
  private readonly apiUrl = import.meta.env.VITE_API_URL;
  private readonly tokenKey = import.meta.env.VITE_AUTH_COOKIE_NAME;
  private readonly tokenExpiry =
    Number(import.meta.env.VITE_AUTH_TOKEN_EXPIRY) || 7;

  private getAuthHeader() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.apiUrl}/auth/login`,
      credentials
    );

    if (response.data.access_token) {
      this.saveToken(response.data.access_token);
    }

    return response.data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.apiUrl}/auth/register`,
      userData
    );

    if (response.data.access_token) {
      this.saveToken(response.data.access_token);
    }

    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await axios.get<User>(`${this.apiUrl}/auth/profile`, {
      headers: this.getAuthHeader(),
    });

    return response.data;
  }
}
