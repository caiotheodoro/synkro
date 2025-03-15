package middleware

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// TokenRequest is the request structure for validating a token
type TokenRequest struct {
	Token string `json:"token"`
}

// TokenResponse is the response structure from the auth service
type TokenResponse struct {
	IsValid bool   `json:"isValid"`
	UserID  string `json:"userId,omitempty"`
}

// AuthMiddleware validates the JWT token from the Authorization header
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip for OPTIONS requests (CORS)
		if c.Request.Method == "OPTIONS" {
			c.Next()
			return
		}

		// Get the token from the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header missing"})
			return
		}

		// Extract the token from the Bearer format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		token = strings.TrimSpace(token)

		// Get the auth service URL from environment variable
		authServiceURL := os.Getenv("AUTH_SERVICE_URL")
		if authServiceURL == "" {
			authServiceURL = "http://api-gateway-auth:3000"
		}

		validateEndpoint := authServiceURL + "/auth/validate-token"
		
		// Create the request body
		tokenRequest := TokenRequest{Token: token}
		jsonData, err := json.Marshal(tokenRequest)
		if err != nil {
			log.Printf("Error marshaling token request: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

		// Send the request to the auth service
		client := &http.Client{}
		req, err := http.NewRequest("POST", validateEndpoint, bytes.NewBuffer(jsonData))
		if err != nil {
			log.Printf("Error creating request: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("Error calling token validation service: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate token"})
			return
		}
		defer resp.Body.Close()

		// Check if the response is successful
		if resp.StatusCode != http.StatusOK {
			log.Printf("Token validation service returned error: %d", resp.StatusCode)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		// Parse the response
		var tokenResponse TokenResponse
		if err := json.NewDecoder(resp.Body).Decode(&tokenResponse); err != nil {
			log.Printf("Failed to parse token validation response: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

		// Check if the token is valid
		if !tokenResponse.IsValid {
			log.Println("Token validation failed: token is invalid")
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		// Set the user ID in the request context for further use
		if tokenResponse.UserID != "" {
			c.Set("userID", tokenResponse.UserID)
			c.Request.Header.Set("X-User-ID", tokenResponse.UserID)
		}

		c.Next()
	}
} 