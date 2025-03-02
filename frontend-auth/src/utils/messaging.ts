/**
 * Utility for sending messages from the auth service to the parent window
 */

// Message types
export enum MessageType {
  AUTH_SUCCESS = "AUTH_SUCCESS",
  AUTH_ERROR = "AUTH_ERROR",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  REGISTRATION_SUCCESS = "REGISTRATION_SUCCESS",
  REGISTRATION_ERROR = "REGISTRATION_ERROR",
  AUTH_STATUS_AUTHENTICATED = "AUTH_STATUS_AUTHENTICATED",
  AUTH_STATUS_UNAUTHENTICATED = "AUTH_STATUS_UNAUTHENTICATED",
}

// Interface for message data
export interface MessageData {
  type: MessageType;
  message?: string;
  user?: any;
  access_token?: string;
}

/**
 * Send a message to the parent window if in an iframe
 */
export function sendMessage(data: MessageData): void {
  if (window.parent !== window) {
    window.parent.postMessage(data, "*");
  }
}

/**
 * Send authentication success message
 */
export function sendAuthSuccess(user: any, access_token: string): void {
  // Send the regular AUTH_SUCCESS message
  sendMessage({
    type: MessageType.AUTH_SUCCESS,
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
    },
    access_token,
  });

  sendMessage({
    type: MessageType.AUTH_STATUS_AUTHENTICATED,
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
    },
    access_token,
  });
}

/**
 * Send authentication error message
 */
export function sendAuthError(message: string): void {
  sendMessage({
    type: MessageType.AUTH_ERROR,
    message,
  });
}

/**
 * Send logout message
 */
export function sendLogout(): void {
  sendMessage({
    type: MessageType.AUTH_LOGOUT,
  });

  sendMessage({
    type: MessageType.AUTH_STATUS_UNAUTHENTICATED,
  });
}

/**
 * Send registration success message
 */
export function sendRegistrationSuccess(user: any, access_token: string): void {
  sendMessage({
    type: MessageType.REGISTRATION_SUCCESS,
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
    },
    access_token,
  });

  sendMessage({
    type: MessageType.AUTH_STATUS_AUTHENTICATED,
    user: {
      id: user?.id,
      email: user?.email,
      name: user?.name,
    },
    access_token,
  });
}

/**
 * Send registration error message
 */
export function sendRegistrationError(message: string): void {
  sendMessage({
    type: MessageType.REGISTRATION_ERROR,
    message,
  });
}

/**
 * Send authentication status message
 */
export function sendAuthStatus(
  isAuthenticated: boolean,
  user?: any,
  access_token?: string
): void {
  sendMessage({
    type: isAuthenticated
      ? MessageType.AUTH_STATUS_AUTHENTICATED
      : MessageType.AUTH_STATUS_UNAUTHENTICATED,
    user:
      isAuthenticated && user
        ? {
            id: user?.id,
            email: user?.email,
            name: user?.name,
          }
        : undefined,
    access_token,
  });
}
