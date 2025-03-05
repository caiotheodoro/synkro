use axum::{
    extract::Request,
    http::{header::HeaderName, HeaderValue, StatusCode},
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use tracing::{error, info};
use uuid::Uuid;

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

pub async fn logging_middleware(request: Request, next: Next) -> Result<Response, StatusCode> {
    let path = request.uri().path().to_owned();
    let method = request.method().clone();
    let start = Instant::now();

    info!("Request started: {} {}", method, path);

    let response = next.run(request).await;

    let status = response.status();
    let duration = start.elapsed();

    info!(
        "Request completed: {} {} - {} in {:?}",
        method, path, status, duration
    );

    Ok(response)
}

pub async fn request_id_middleware(
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let request_id = Uuid::new_v4().to_string();

    if let Ok(value) = HeaderValue::from_str(&request_id) {
        request
            .headers_mut()
            .insert(HeaderName::from_static("x-request-id"), value);
    }

    let _span = tracing::info_span!("request", id = %request_id).entered();
    info!("Request received with ID: {}", request_id);

    match next.run(request).await {
        response => Ok(response),
    }
}
