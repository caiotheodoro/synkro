import { AuthController } from "@/controllers/auth.controller";

class AuthInstanceService {
  private static instance: AuthController;

  public static getInstance(): AuthController {
    if (!AuthInstanceService.instance) {
      AuthInstanceService.instance = AuthController.getInstance();
    }
    return AuthInstanceService.instance;
  }
}

export const auth = AuthInstanceService.getInstance();
