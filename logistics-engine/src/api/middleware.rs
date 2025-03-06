use axum::{extract::Request, http::StatusCode, middleware::Next, response::Response};
use tracing::error;

pub async fn auth_middleware(request: Request, next: Next) -> Result<Response, StatusCode> {
    let headers = request.headers();

    let auth_header = headers
        .get("Authorization")
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth) if auth.starts_with("Bearer ") => Ok(next.run(request).await),
        _ => {
            error!("Unauthorized access attempt");
            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
