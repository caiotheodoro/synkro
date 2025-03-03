use axum::{routing::get, Router};
use std::net::SocketAddr;
use tokio::net::TcpListener;

async fn health() -> &'static str {
    println!("Health check called");
    "OK"
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting logistics engine...");

    let app = Router::new().route("/health", get(health));

    println!("Router configured");

    let port = 5050;
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Binding to address: {}", addr);

    let listener = TcpListener::bind(addr).await?;
    println!("Listener bound successfully on port {}", port);

    println!("Starting server...");
    axum::serve(listener, app).await?;

    Ok(())
}
