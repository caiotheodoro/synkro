# Synkro Frontend Dashboard Service

## Overview

The Frontend Dashboard service is a Next.js-based microfrontend that serves as the main authenticated interface for users of the Synkro platform. It provides a comprehensive dashboard with data visualization, user management, and core platform functionality, accessible only after authentication. Built with Next.js, React, and TypeScript, it follows atomic design principles and implements a neobrutalism design aesthetic with Shadcn UI components.

## Technology Stack

- **Framework**: Next.js 14
- **UI Library**: React 18
- **Component Library**: Shadcn UI with Radix UI primitives
- **Styling**: TailwindCSS with Neobrutalism approach
- **Icons**: Lucide React
- **Type Safety**: TypeScript
- **Microfrontend**: Module Federation (currently disabled)
- **State Management**: React Context API and hooks
- **Utilities**: Class Variance Authority, clsx, tailwind-merge

## Architecture

The Frontend Dashboard service follows a modular architecture with the following structure:

```
frontend-dashboard/
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (auth)/         # Authentication-protected routes
│   │   ├── api/            # API routes
│   │   └── layout.tsx      # Root layout
│   ├── components/         # Reusable UI components following Atomic Design
│   │   ├── atoms/          # Basic building blocks (buttons, inputs, etc.)
│   │   ├── molecules/      # Combinations of atoms (form fields, cards, etc.)
│   │   ├── organisms/      # Complex UI components (tables, data grids, etc.)
│   │   ├── layouts/        # Layout components and wrappers
│   │   ├── navigation/     # Navigation components
│   │   └── ui/             # Shadcn UI components
│   ├── types/              # TypeScript type definitions
│   ├── lib/                # Utility functions and helpers
│   ├── services/           # API communication and business logic
│   ├── store/              # State management
│   ├── hooks/              # Custom React hooks
│   ├── styles/             # Global styles and Tailwind configuration
│   ├── middleware.ts       # Next.js middleware for route protection
│   └── utils/              # Utility functions and helpers
├── public/                 # Static files to be served as-is
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── next.config.js          # Next.js configuration with Module Federation
├── tailwind.config.js      # TailwindCSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies and scripts
```

## Key Features

### Dashboard Components

- **Dashboard Overview**: Main dashboard with summary metrics and widgets
- **Data Visualization**: Charts, graphs, and data display components
- **User Management**: User profile and settings management
- **Navigation**: Sidebar and top navigation with role-based access control
- **Notifications**: Real-time notification system
- **Settings**: Application and user settings

### Core Dashboard Sections

- **Analytics**: Data analytics and reporting
- **Inventory**: Inventory management interface
- **Orders**: Order processing and management
- **Users**: User administration (admin only)
- **Settings**: Application configuration

### UI Components

Following atomic design methodology:

- **Atoms**: Buttons, inputs, labels, icons, typography elements
- **Molecules**: Form fields, search bars, data cards, modal dialogs
- **Organisms**: Data tables, navigation bars, form sections, wizards
- **Templates**: Page layout templates with content placeholders
- **Pages**: Complete pages with actual content

## Authentication and Authorization

- **Token-based Authentication**: Uses JWT tokens from Frontend Auth service
- **Route Protection**: Server-side middleware and client-side guards
- **Role-based Access Control**: Different views based on user roles
- **Session Management**: Token refresh and expiration handling

## Module Federation

The dashboard uses Module Federation for component sharing (currently disabled):

- **Exposes**: DashboardLayout, DashboardNav, UserProfile
- **Remotes**: Can consume components from other microfrontends
- **Shared Dependencies**: React, React DOM, and other core libraries
- **Runtime Integration**: Dynamic loading of remote components

## API Communication

The service communicates with multiple backend services:

- **Auth API**: Token validation and user authentication
- **Inventory API**: Inventory data and management
- **Analytics API**: Reporting and dashboard metrics
- **Notification API**: User notifications and alerts

## Data Fetching

The service uses multiple data fetching strategies:

- **Server Components**: Data fetching in server components
- **React Query**: For client-side data fetching with caching
- **SWR**: For data fetching with revalidation
- **API Routes**: Next.js API routes for BFF (Backend for Frontend) patterns

## Environment Configuration

The service uses the following environment variables:

```
NEXT_PRIVATE_LOCAL_WEBPACK=true
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_AUTH_COOKIE_NAME=synkro_auth_token
NEXT_PUBLIC_AUTH_TOKEN_EXPIRY=7
NEXT_PUBLIC_AUTH_TOKEN_KEY=synkro_token
NEXT_PUBLIC_AUTH_USER_KEY=synkro_user
NEXT_PUBLIC_DEV=false
NEXT_PUBLIC_LANDING_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_INTERFACE_URL=http://localhost:5173
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

### Starting Production Server

```bash
# Start production server
pnpm start
```

### Linting

```bash
# Lint code
pnpm lint
```

## Neobrutalism Design Implementation

The service implements a neobrutalism design approach with:

- Bold, chunky elements with high contrast
- Solid background colors with minimal gradients
- Strong borders and defined edges
- Playful typography
- Deliberate "unrefined" appearance for UI elements
- High-contrast color combinations
- Oversized interactive elements

## Responsive Design

The dashboard is fully responsive with:

- Mobile-first design approach
- Responsive navigation (collapsible sidebar)
- Adaptive layouts for different screen sizes
- Touch-friendly controls for mobile devices
- Responsive data tables and visualization

## Performance Optimization

The service implements several performance optimizations:

- Server components for reduced client-side JavaScript
- Code splitting and lazy loading
- Image optimization with Next.js Image component
- Font optimization with next/font
- Incremental Static Regeneration for semi-static content
- Edge caching strategies

## Accessibility

The service follows accessibility best practices:

- Semantic HTML structure
- ARIA attributes where necessary
- Keyboard navigation support
- Screen reader compatibility
- Focus management for interactive elements
- Color contrast compliance

## Security Considerations

- **CSRF Protection**: Guards against cross-site request forgery
- **Authentication**: Secure token handling and validation
- **Content Security Policy**: Prevents XSS and other injections
- **Input Validation**: Thorough validation of all user inputs
- **Role-based Access**: Restricted access based on user roles

## Integration with Other Services

- **Frontend Auth**: For authentication and user management
- **API Gateway Auth**: For API authentication and authorization
- **Frontend Landing**: For navigation back to public landing page

## Deployment

The service is configured for deployment:

- Containerization with Docker
- Kubernetes deployment support
- Environment-specific configuration
- Health checks and monitoring endpoints

## Error Handling

The dashboard implements comprehensive error handling:

- Error boundaries for component-level error catching
- Custom error pages for different error types
- Graceful degradation for API failures
- Detailed error logging and reporting

## Testing

The service includes a testing strategy:

- Unit tests with Jest
- Component testing with React Testing Library
- Integration tests for complex workflows
- E2E testing with Cypress (optional)

## Troubleshooting

Common issues and solutions:

- **Authentication Issues**: Verify environment variables for auth service URLs
- **API Connection Problems**: Check API_URL configuration
- **Module Federation Errors**: Ensure proper webpack configuration
- **Styling Inconsistencies**: Check TailwindCSS configuration
- **Build Failures**: Review Next.js configuration and plugin compatibility 