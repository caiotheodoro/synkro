use jsonwebtoken::{
    decode, encode, Algorithm, DecodingKey, EncodingKey, Header, TokenData, Validation,
};
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,  // Subject (user ID)
    pub role: String, // User role
    pub exp: u64,     // Expiration time (in seconds since UNIX epoch)
    pub iat: u64,     // Issued at (in seconds since UNIX epoch)
    pub jti: String,  // JWT ID (unique identifier for this token)
}

pub fn generate_token(user_id: &Uuid, role: &str) -> Result<String, AppError> {
    let config = config::get();

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    let expiration = now + config.auth.jwt_expiration;

    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        exp: expiration,
        iat: now,
        jti: Uuid::new_v4().to_string(),
    };

    let header = Header::new(Algorithm::HS256);

    encode(
        &header,
        &claims,
        &EncodingKey::from_secret(config.auth.jwt_secret.as_bytes()),
    )
    .map_err(|err| AppError::InternalServerError(format!("Failed to generate token: {}", err)))
}

pub fn validate_token(token: &str) -> Result<TokenData<Claims>, AppError> {
    let config = config::get();

    let validation = Validation::new(Algorithm::HS256);

    decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.auth.jwt_secret.as_bytes()),
        &validation,
    )
    .map_err(|err| match err.kind() {
        jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
            AppError::Unauthorized("Token expired".to_string())
        }
        jsonwebtoken::errors::ErrorKind::InvalidSignature => {
            AppError::Unauthorized("Invalid token signature".to_string())
        }
        _ => AppError::Unauthorized(format!("Invalid token: {}", err)),
    })
}

pub fn extract_user_id(token: &str) -> Result<Uuid, AppError> {
    let token_data = validate_token(token)?;

    Uuid::parse_str(&token_data.claims.sub)
        .map_err(|_| AppError::InternalServerError("Invalid user ID in token".to_string()))
}

pub fn extract_role(token: &str) -> Result<String, AppError> {
    let token_data = validate_token(token)?;

    Ok(token_data.claims.role)
}

pub fn is_token_expired(token: &str) -> bool {
    validate_token(token).is_err()
}
