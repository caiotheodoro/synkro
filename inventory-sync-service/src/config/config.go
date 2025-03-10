package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the service
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
}

// ServerConfig holds server-specific configuration
type ServerConfig struct {
	GRPCPort string
	HTTPPort string
	Env      string
}

// DatabaseConfig holds database-specific configuration
type DatabaseConfig struct {
	URL      string
	Username string
	Password string
	Name     string
	Port     string
	Host     string
	SSLMode  string
	MaxConns int
	Timeout  int
}

// AuthConfig holds authentication-specific configuration
type AuthConfig struct {
	JWTSecret string
}

// Load loads configuration from environment variables
func Load() *Config {
	return &Config{
		Server: ServerConfig{
			GRPCPort: getEnv("GRPC_PORT", ":50051"),
			HTTPPort: getEnv("HTTP_PORT", ":8080"),
			Env:      getEnv("ENV", "development"),
		},
		Database: DatabaseConfig{
			URL:      getEnv("DATABASE_URL", "postgres://logistics:logistics_password@localhost:5433/logistics_engine?sslmode=disable"),
			Username: getEnv("POSTGRES_USER", "logistics"),
			Password: getEnv("POSTGRES_PASSWORD", "logistics_password"),
			Name:     getEnv("POSTGRES_DB", "logistics_engine"),
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     getEnv("POSTGRES_PORT", "5433"),
			SSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),
			MaxConns: getEnvAsInt("DB_MAX_CONNECTIONS", 10),
			Timeout:  getEnvAsInt("DB_TIMEOUT_SECONDS", 30),
		},
		Auth: AuthConfig{
			JWTSecret: getEnv("JWT_SECRET", "default-secret-key-for-development-only"),
		},
	}
}

// IsDevelopment returns true if the environment is development
func (c *Config) IsDevelopment() bool {
	return c.Server.Env == "development"
}

// IsProduction returns true if the environment is production
func (c *Config) IsProduction() bool {
	return c.Server.Env == "production"
}

// GetDatabaseDSN returns the database connection string
func (c *Config) GetDatabaseDSN() string {
	if c.Database.URL != "" {
		return c.Database.URL
	}
	return "postgres://" + c.Database.Username + ":" + c.Database.Password + "@" + 
		c.Database.Host + ":" + c.Database.Port + "/" + c.Database.Name + "?sslmode=" + c.Database.SSLMode
}

// Helper function to get an environment variable or a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// Helper function to get an environment variable as an integer
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
} 