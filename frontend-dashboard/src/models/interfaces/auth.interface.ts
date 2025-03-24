export interface IUser {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
}

export interface IAuthConfig {
  tokenKey: string;
  userKey: string;
  authServiceUrl: string;
  authInterfaceUrl: string;
}

export interface IAuthResponse {
  access_token: string;
  user: IUser;
}

export interface ITokenValidationResponse {
  isValid: boolean;
}
