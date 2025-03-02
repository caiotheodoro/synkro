import { fastifyHelmet } from '@fastify/helmet';
import { FastifyInstance } from 'fastify';
import { ConfigService } from '@nestjs/config';

export const configureSecurityMiddleware = async (
  app: FastifyInstance,
  config: ConfigService,
) => {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  });

  // Configure HTTPS
  if (config.get('NODE_ENV') === 'production') {
    app.register(require('@fastify/https-redirect'));
    await app.register(require('@fastify/secure-session'), {
      secret: config.get('SESSION_SECRET'),
      salt: config.get('SESSION_SALT'),
      cookieName: 'session',
      cookie: {
        secure: true,
        httpOnly: true,
        sameSite: true,
      },
    });
  }

  // Configure CSRF Protection
  await app.register(require('@fastify/csrf-protection'), {
    sessionPlugin: '@fastify/secure-session',
    getToken: (req) => {
      return req.headers['csrf-token'];
    },
    // Exclude authentication endpoints from CSRF protection
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS', 'POST'],
    // Alternatively, use a more specific path-based exclusion
    // ignorePaths: ['/api/auth/login', '/api/auth/register', '/api/auth/logout', '/api/auth/validate-token'],
  });
};
