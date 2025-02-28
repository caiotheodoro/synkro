# Synkro Frontend Auth

This is a microfrontend for authentication built with Vue 3, TypeScript, and TailwindCSS. It provides user authentication functionality including login, registration, and profile management.

## Features

- User authentication (login/logout)
- User registration
- Profile management
- Responsive design with TailwindCSS
- Type safety with TypeScript
- State management with Pinia

## Project Setup

```sh
# Install dependencies
npm install

# Compile and Hot-Reload for Development
npm run dev

# Type-Check, Compile and Minify for Production
npm run build

# Lint with ESLint
npm run lint
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_API_URL=http://localhost:3000
VITE_AUTH_COOKIE_NAME=synkro_auth_token
VITE_AUTH_TOKEN_EXPIRY=7
```

## Architecture

This microfrontend follows a modular architecture with the following structure:

- `src/assets`: Static assets like images and global CSS
- `src/components`: Reusable Vue components
- `src/composables`: Reusable composition functions
- `src/router`: Vue Router configuration
- `src/services`: API services
- `src/stores`: Pinia stores for state management
- `src/types`: TypeScript type definitions
- `src/views`: Page components

## Integration

This microfrontend can be integrated into a main application using:

1. Module Federation
2. NPM package
3. iFrame embedding
4. Custom Elements / Web Components

## License

[MIT](LICENSE) 