# Synkro Frontend Auth Service

## Overview

The Frontend Auth service is a Vue.js-based microfrontend responsible for handling user authentication functionality within the Synkro platform. It provides a dedicated interface for user registration, login, token validation, and profile management. Built with Vue 3, Vite, and TypeScript, it follows atomic design principles and implements a neobrutalism design aesthetic.

## Technology Stack

- **Framework**: Vue.js 3
- **Build System**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: TailwindCSS with Neobrutalism approach
- **HTTP Client**: Axios
- **Type Safety**: TypeScript
- **Composition API**: @vueuse/core utilities

## Architecture

The Frontend Auth service follows a modular architecture with the following structure:

```
frontend-auth/
├── src/
│   ├── assets/           # Static assets (images, fonts, etc.)
│   ├── components/       # Reusable UI components following Atomic Design
│   │   ├── atoms/        # Basic building blocks (buttons, inputs, etc.)
│   │   ├── molecules/    # Combinations of atoms (form fields, cards, etc.)
│   │   └── organisms/    # Complex UI components (forms, headers, etc.)
│   ├── composables/      # Reusable composition functions
│   ├── router/           # Vue Router configuration and route definitions
│   ├── services/         # API communication and business logic
│   ├── stores/           # Pinia state management stores
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions and helpers
│   ├── views/            # Page components
│   ├── App.vue           # Root component
│   ├── main.ts           # Application entry point
│   └── shims-vue.d.ts    # Vue TypeScript declarations
├── public/               # Static files to be served as-is
├── .env                  # Environment variables
├── .env.example          # Example environment variables
├── index.html            # HTML entry point
├── tailwind.config.js    # TailwindCSS configuration
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Project dependencies and scripts
```

## Key Components

### Authentication Views

The service includes the following key views:

- **LoginView**: Handles user login with email/password
- **RegisterView**: Handles new user registration
- **ProfileView**: Displays user profile information
- **LogoutView**: Handles user logout
- **ValidateTokenView**: Special view for token validation requests from other microfrontends
- **NotFoundView**: 404 error handling

### Authentication Store

The Pinia auth store manages authentication state:

- User information
- Authentication status
- Token management
- Login/logout operations

### Authentication Service

The auth service handles API calls to the backend:

- Login requests
- Registration requests
- Profile data fetching
- Token validation
- Token storage in localStorage

### Router Configuration

The router handles navigation and route guards:

- Public routes
- Protected routes requiring authentication
- Guest-only routes (not accessible when authenticated)
- Automatic redirects based on auth state

## Authentication Flow

1. **Login Flow**:
   - User enters credentials in LoginView
   - Credentials are validated client-side
   - Auth service sends credentials to API Gateway
   - On success, token is stored in localStorage
   - User is redirected to profile page
   - Auth store is updated with user data

2. **Registration Flow**:
   - User enters information in RegisterView
   - Data is validated client-side
   - Auth service sends registration data to API Gateway
   - On success, token is stored in localStorage
   - User is redirected to profile page
   - Auth store is updated with user data

3. **Token Validation**:
   - Other microfrontends can request token validation
   - ValidateTokenView handles these requests
   - Token is sent to API Gateway for validation
   - Validation result is returned

4. **Logout Flow**:
   - User initiates logout
   - Token is sent to API Gateway for invalidation
   - Token is removed from localStorage
   - Auth store is cleared
   - User is redirected to login page

## API Communication

The service communicates with the API Gateway Auth service using Axios:

- **Base URL**: Configured via VITE_API_URL environment variable
- **Endpoints**:
  - `POST /auth/login`: User login
  - `POST /auth/register`: User registration
  - `GET /auth/profile`: Get user profile
  - `POST /auth/validate-token`: Validate JWT token
  - `POST /auth/logout`: Logout and invalidate token

## Environment Configuration

The service uses the following environment variables:

```
VITE_API_URL=http://localhost:3000/api
VITE_AUTH_COOKIE_NAME=synkro_auth_token
VITE_AUTH_TOKEN_EXPIRY=7
```

## Development

### Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher

### Installation

```bash
# Install dependencies
pnpm install
```

### Development Server

```bash
# Start development server
pnpm dev
```

### Building for Production

```bash
# Build for production
pnpm build
```

### Linting and Formatting

```bash
# Lint and fix files
pnpm lint

# Format files
pnpm format
```

## Testing

The service includes unit and component tests:

```bash
# Run tests
pnpm test
```

## Integration with Other Services

- **API Gateway Auth**: Core authentication backend
- **Frontend Dashboard**: Uses tokens provided by this service
- **Frontend Landing**: Links to this service for authentication

## Neobrutalism Design Implementation

The service implements a neobrutalism design approach with:

- Bold, chunky elements with high contrast
- Solid background colors with minimal gradients
- Strong borders and defined edges
- Playful typography
- Deliberate "unrefined" appearance for UI elements

## Security Considerations

- Passwords are never stored client-side
- Tokens are stored in localStorage with appropriate expiry
- Route guards prevent access to protected resources
- API calls include appropriate headers for authentication
- Input validation is performed on all forms
- CSRF protections are implemented for API calls

## Deployment

The service is designed to be deployed as a standalone microfrontend:

- Build artifacts can be served from any static file server
- Configured to run on port 5173 by default
- Can be deployed behind a reverse proxy for production

## Troubleshooting

Common issues and solutions:

- **API Connection Issues**: Verify VITE_API_URL is correctly set
- **Authentication Failures**: Check browser console for specific errors
- **CSS Styling Issues**: Ensure TailwindCSS is properly configured
- **Type Errors**: Run `vue-tsc --noEmit` to check type issues 