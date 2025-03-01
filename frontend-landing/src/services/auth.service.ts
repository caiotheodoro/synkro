export interface User {
  id: string;
  email: string;
  name: string;
  [key: string]: any;
}

class AuthService {
  private userKey = "synkro_user";
  private tokenKey = "synkro_token";

  getUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch (error) {
      console.error("Failed to parse user data", error);
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tokenKey);
    window.location.href = "/";
  }
}

// Export as singleton
export const authService = new AuthService();
