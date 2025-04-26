import os
import json
import httpx
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from app.core.logging.logger import logger

async def auth_middleware(request: Request, call_next):
    # Skip for OPTIONS requests (CORS)
    if request.method == "OPTIONS":
        return await call_next(request)
    
    # Get the token from the Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        logger.warning("Authentication failed: Authorization header missing")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Authorization header missing"}
        )
    
    # Extract the token from the Bearer format
    if not auth_header.startswith("Bearer "):
        logger.warning("Authentication failed: Invalid authorization format")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Invalid authorization format"}
        )
    
    token = auth_header.replace("Bearer ", "").strip()
    
    # Get the auth service URL from environment variable
    auth_service_url = os.environ.get("AUTH_SERVICE_URL", "http://api-gateway-auth:3000")
    validate_endpoint = f"{auth_service_url}/auth/validate-token"
    
    logger.debug(f"Validating token against {validate_endpoint}")
    
    # Create the request body
    token_request = {"token": token}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                validate_endpoint,
                json=token_request,
                headers={"Content-Type": "application/json"},
                timeout=10.0
            )
            
            if response.status_code != status.HTTP_200_OK:
                logger.warning(f"Token validation failed: service returned {response.status_code}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Invalid token"}
                )
            
            token_response = response.json()
            
            if not token_response.get("isValid", False):
                logger.warning("Token validation failed: token is invalid")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"error": "Invalid token"}
                )
            
            # Set the user ID in the request state for further use
            user_id = token_response.get("userId")
            if user_id:
                request.state.user_id = user_id
                
                # Modify request to include user ID header for downstream services
                request.headers["X-User-ID"] = user_id
                logger.info(f"Authentication successful for user {user_id}")
            else:
                logger.info("Authentication successful (no user ID provided)")
    
    except Exception as e:
        logger.error(f"Failed to validate token: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": f"Failed to validate token: {str(e)}"}
        )
    
    # Continue processing the request
    return await call_next(request) 