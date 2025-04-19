# Build database URLs with asyncpg driver
predictions_db_url = settings.database_urls["predictions"].replace('postgresql://', 'postgresql+asyncpg://')
predictions_sync_url = settings.database_urls["predictions"]

# Logistics Database URLs with asyncpg driver
logistics_db_url = settings.database_urls["logistics"].replace('postgresql://', 'postgresql+asyncpg://')
logistics_sync_url = settings.database_urls["logistics"] 