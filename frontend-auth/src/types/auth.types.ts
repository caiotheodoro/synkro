export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role: UserRole
  isActive: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface AuthResponse {
  access_token: string
  user: User
} 