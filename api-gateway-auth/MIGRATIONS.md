# Database Migrations Guide

This guide explains how to work with database migrations in the API Gateway Auth service.

## Migration Commands

The following commands are available for managing database migrations:

### Generate a Migration

To generate a migration based on entity changes:

```bash
npm run migration:generate --name=migration-name
```

Replace `migration-name` with a descriptive name for your migration.

### Create an Empty Migration

To create an empty migration file:

```bash
npm run migration:create --name=migration-name
```

### Run Migrations

To run all pending migrations:

```bash
npm run migration:run
```

### Revert the Last Migration

To revert the most recently applied migration:

```bash
npm run migration:revert
```

### Show Migration Status

To see the status of all migrations:

```bash
npm run migration:show
```

## Automatic Migration Execution

The application is configured to automatically run migrations on startup. This behavior is controlled by the `DB_MIGRATIONS_RUN` environment variable in the `.env` file.

## Manual Database Setup

If you need to set up the database manually:

1. Create a PostgreSQL database named `api_gateway_auth` (or as specified in your `.env` file)
2. Run the migrations: `npm run migration:run`

## Troubleshooting

If you encounter issues with migrations:

1. Check the database connection settings in your `.env` file
2. Ensure PostgreSQL is running and accessible
3. Check the migration logs for specific error messages
4. Try running migrations manually with `npm run migration:run`

For the "relation does not exist" error, make sure migrations have been run successfully before starting the application. 