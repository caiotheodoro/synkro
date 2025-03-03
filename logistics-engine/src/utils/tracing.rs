use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::{fmt, prelude::*, EnvFilter, Layer};

use crate::config;

pub fn init_telemetry() -> Result<(), Box<dyn std::error::Error>> {
    let app_config = config::get();

    // Create an environment filter
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(app_config.tracing.log_level.clone()));

    // Create a formatting layer
    let fmt_layer = fmt::layer()
        .with_target(true)
        .with_level(true)
        .with_ansi(app_config.tracing.log_format != "json")
        .with_writer(std::io::stdout);

    // Configure the subscriber based on the log format
    if app_config.tracing.log_format == "json" {
        let json_layer = fmt::layer()
            .json()
            .with_target(true)
            .with_level(true)
            .with_current_span(true)
            .with_writer(std::io::stdout);

        tracing_subscriber::registry()
            .with(env_filter)
            .with(json_layer)
            .init();
    } else {
        tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt_layer)
            .init();
    }

    Ok(())
}

/// Create a span for an incoming request
pub fn create_request_span(
    request_id: &str,
    method: &str,
    path: &str,
    user_id: Option<&str>,
) -> tracing::Span {
    tracing::info_span!(
        "http_request",
        request_id = %request_id,
        method = %method,
        path = %path,
        user_id = user_id.unwrap_or("anonymous"),
        start_time = tracing::field::Empty,
    )
}
