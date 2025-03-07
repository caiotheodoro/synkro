use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use http::header::HeaderValue;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::env;
use tracing::{error, info};

#[derive(Serialize)]
struct ValidateTokenRequest {
    token: String,
}

#[derive(Deserialize, Debug)]
struct ValidateTokenResponse {
    is_valid: bool,
    user_id: Option<String>,
}

pub async fn auth_middleware(request: Request, next: Next) -> Result<Response, StatusCode> {
    if request.method() == http::Method::OPTIONS {
        return Ok(next.run(request).await);
    }

    println!("auth_middleware");

    let headers = request.headers();

    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth) if auth.starts_with("Bearer ") => {
            let token = auth.trim_start_matches("Bearer ").trim();
            println!("token: {}", token);

            let auth_service_url = env::var("AUTH_SERVICE_URL")
                .unwrap_or_else(|_| "http://api-gateway-auth:3000".to_string());

            println!("auth_service_url: {}", auth_service_url);
            let validate_endpoint = format!("{}/auth/validate-token", auth_service_url);

            println!("validate_endpoint: {}", validate_endpoint);
            let client = Client::new();

            match client
                .post(&validate_endpoint)
                .json(&ValidateTokenRequest {
                    token: token.to_string(),
                })
                .send()
                .await
            {
                Ok(response) => {
                    if response.status().is_success() {
                        match response.json::<ValidateTokenResponse>().await {
                            Ok(validate_result) => {
                                if validate_result.is_valid {
                                    info!("Token validated successfully");

                                    let mut request = request;
                                    if let Some(user_id) = validate_result.user_id {
                                        let headers = request.headers_mut();
                                        headers.insert(
                                            "X-User-ID",
                                            user_id
                                                .parse()
                                                .unwrap_or_else(|_| HeaderValue::from_static("")),
                                        );
                                    }

                                    Ok(next.run(request).await)
                                } else {
                                    error!("Token validation failed: token is invalid");
                                    Err(StatusCode::UNAUTHORIZED)
                                }
                            }
                            Err(e) => {
                                error!("Failed to parse token validation response: {}", e);
                                Err(StatusCode::INTERNAL_SERVER_ERROR)
                            }
                        }
                    } else {
                        error!(
                            "Token validation service returned error: {}",
                            response.status()
                        );
                        Err(StatusCode::UNAUTHORIZED)
                    }
                }
                Err(e) => {
                    error!("Failed to call token validation service: {}", e);
                    Err(StatusCode::INTERNAL_SERVER_ERROR)
                }
            }
        }
        _ => {
            error!("Unauthorized access attempt: missing or invalid Authorization header");
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
