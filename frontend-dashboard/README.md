# Synkro Dashboard Microfrontend

This is the dashboard microfrontend for the Synkro AI-Fueled Supply Chain Optimization Platform. It's built with Next.js 15, React 19, and Module Federation.

## Features

- Modern dashboard UI with neobrutalism design
- Real-time inventory management
- Order tracking and management
- Supplier management
- AI-powered analytics and predictions
- User profile and settings

## Technology Stack

- **Next.js 15**: React framework for server-side rendering and static site generation
- **React 19**: UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Module Federation**: For microfrontend architecture
- **Shadcn UI / Radix UI**: Accessible UI components

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Run the development server
pnpm dev
```

The dashboard will be available at http://localhost:3002.

### Building for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## Microfrontend Architecture

This dashboard is part of a microfrontend architecture using Module Federation. It exposes the following components:

- `./DashboardLayout`: The main layout component for the dashboard
- `./DashboardNav`: The navigation component
- `./UserProfile`: The user profile component

## Integration with Other Microfrontends

The dashboard can be integrated with other microfrontends using Module Federation. Configure the remote entry in your host application:

```javascript
// next.config.js of the host application
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'host',
        remotes: {
          dashboard: 'dashboard@http://localhost:3002/_next/static/chunks/remoteEntry.js',
        },
        // ...
      })
    );
    return config;
  },
};
```

Then import the components in your application:

```javascript
import dynamic from 'next/dynamic';

const DashboardLayout = dynamic(() => import('dashboard/DashboardLayout'), {
  ssr: false,
});
```

## License

ISC 