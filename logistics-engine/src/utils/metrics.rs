use once_cell::sync::OnceCell;
use opentelemetry::metrics::{Counter, Histogram, Meter, Unit};
use opentelemetry::KeyValue;
use opentelemetry_otlp::WithExportConfig;
use opentelemetry_sdk::metrics::reader::TemporalityPreference;
use opentelemetry_sdk::metrics::{PeriodicReader, SdkMeterProvider};
use opentelemetry_sdk::Resource;
use std::time::{Duration, Instant};

use crate::config;

static METRICS: OnceCell<Metrics> = OnceCell::new();

pub struct Metrics {
    meter: Meter,
    http_requests_total: Counter<u64>,
    http_request_duration: Histogram<f64>,
    db_operations_total: Counter<u64>,
    db_operation_duration: Histogram<f64>,
    grpc_requests_total: Counter<u64>,
    grpc_request_duration: Histogram<f64>,
    queue_operations_total: Counter<u64>,
    queue_operation_duration: Histogram<f64>,
    active_connections: Counter<i64>,
}

impl Metrics {
    fn new() -> Self {
        let app_config = config::get();

        // Configure the OpenTelemetry metrics exporter
        let exporter = opentelemetry_otlp::new_exporter()
            .tonic()
            .with_endpoint(&app_config.metrics.otlp_endpoint);

        // Create a periodic reader for the exporter
        let reader = PeriodicReader::builder(exporter, opentelemetry::runtime::Tokio)
            .with_interval(Duration::from_secs(app_config.metrics.export_interval_secs))
            .with_temporality_preference(TemporalityPreference::Cumulative)
            .build();

        // Create a meter provider with the reader
        let provider = SdkMeterProvider::builder()
            .with_reader(reader)
            .with_resource(Resource::new(vec![
                KeyValue::new("service.name", "logistics-engine"),
                KeyValue::new("service.version", env!("CARGO_PKG_VERSION")),
                KeyValue::new("deployment.environment", &app_config.metrics.environment),
            ]))
            .build();

        // Create a meter from the provider
        let meter = provider.meter("logistics-engine");

        // Create the metrics
        let http_requests_total = meter
            .u64_counter("http_requests_total")
            .with_description("Total number of HTTP requests processed")
            .init();

        let http_request_duration = meter
            .f64_histogram("http_request_duration_seconds")
            .with_description("HTTP request duration in seconds")
            .with_unit(Unit::new("s"))
            .init();

        let db_operations_total = meter
            .u64_counter("db_operations_total")
            .with_description("Total number of database operations")
            .init();

        let db_operation_duration = meter
            .f64_histogram("db_operation_duration_seconds")
            .with_description("Database operation duration in seconds")
            .with_unit(Unit::new("s"))
            .init();

        let grpc_requests_total = meter
            .u64_counter("grpc_requests_total")
            .with_description("Total number of gRPC requests processed")
            .init();

        let grpc_request_duration = meter
            .f64_histogram("grpc_request_duration_seconds")
            .with_description("gRPC request duration in seconds")
            .with_unit(Unit::new("s"))
            .init();

        let queue_operations_total = meter
            .u64_counter("queue_operations_total")
            .with_description("Total number of message queue operations")
            .init();

        let queue_operation_duration = meter
            .f64_histogram("queue_operation_duration_seconds")
            .with_description("Message queue operation duration in seconds")
            .with_unit(Unit::new("s"))
            .init();

        let active_connections = meter
            .i64_counter("active_connections")
            .with_description("Number of currently active connections")
            .init();

        Metrics {
            meter,
            http_requests_total,
            http_request_duration,
            db_operations_total,
            db_operation_duration,
            grpc_requests_total,
            grpc_request_duration,
            queue_operations_total,
            queue_operation_duration,
            active_connections,
        }
    }

    pub fn get() -> &'static Metrics {
        METRICS.get_or_init(Metrics::new)
    }

    pub fn track_http_request<F, T>(&self, method: &str, path: &str, status_code: u16, f: F) -> T
    where
        F: FnOnce() -> T,
    {
        let attributes = [
            KeyValue::new("method", method.to_string()),
            KeyValue::new("path", path.to_string()),
            KeyValue::new("status_code", status_code.to_string()),
        ];

        self.http_requests_total.add(1, &attributes);

        let start = Instant::now();
        let result = f();
        let duration = start.elapsed().as_secs_f64();

        self.http_request_duration.record(duration, &attributes);

        result
    }

    pub fn track_db_operation<F, T>(&self, operation: &str, entity: &str, f: F) -> T
    where
        F: FnOnce() -> T,
    {
        let attributes = [
            KeyValue::new("operation", operation.to_string()),
            KeyValue::new("entity", entity.to_string()),
        ];

        self.db_operations_total.add(1, &attributes);

        let start = Instant::now();
        let result = f();
        let duration = start.elapsed().as_secs_f64();

        self.db_operation_duration.record(duration, &attributes);

        result
    }

    pub fn track_grpc_request<F, T>(
        &self,
        service: &str,
        method: &str,
        status_code: &str,
        f: F,
    ) -> T
    where
        F: FnOnce() -> T,
    {
        let attributes = [
            KeyValue::new("service", service.to_string()),
            KeyValue::new("method", method.to_string()),
            KeyValue::new("status_code", status_code.to_string()),
        ];

        self.grpc_requests_total.add(1, &attributes);

        let start = Instant::now();
        let result = f();
        let duration = start.elapsed().as_secs_f64();

        self.grpc_request_duration.record(duration, &attributes);

        result
    }

    pub fn track_queue_operation<F, T>(&self, operation: &str, queue: &str, f: F) -> T
    where
        F: FnOnce() -> T,
    {
        let attributes = [
            KeyValue::new("operation", operation.to_string()),
            KeyValue::new("queue", queue.to_string()),
        ];

        self.queue_operations_total.add(1, &attributes);

        let start = Instant::now();
        let result = f();
        let duration = start.elapsed().as_secs_f64();

        self.queue_operation_duration.record(duration, &attributes);

        result
    }

    pub fn connection_opened(&self) {
        self.active_connections.add(1, &[]);
    }

    pub fn connection_closed(&self) {
        self.active_connections.add(-1, &[]);
    }
}
