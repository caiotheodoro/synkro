import { AuthService } from "../services/auth.service";
import { IUser } from "../models/interfaces/auth.interface";

export class AuthController {
  private static instance: AuthController;
  private readonly service: AuthService;

  private constructor() {
    this.service = new AuthService();
  }

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  public isAuthenticated(): boolean {
    return this.service.isAuthenticated();
  }

  public getUser(): IUser | null {
    return this.service.getUser();
  }

  public async validateSession(): Promise<boolean> {
    return this.service.validateToken();
  }

  public async logout(): Promise<void> {
    await this.service.logout();
  }

  public getToken(): string | null {
    return this.service.getToken();
  }

  public clearAuth(): void {
    this.service.clearAuth();
  }

  public redirectToLogin(): void {
    this.service.redirectToLogin();
  }
}
