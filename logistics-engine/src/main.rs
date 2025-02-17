use axum::{
    routing::get,
    Router,
};
use tokio::net::TcpListener;
use std::net::SocketAddr;

async fn health() -> &'static str {
    println!("Health check called");
    "OK"
}

async fn find_available_port(start_port: u16) -> Option<u16> {
    for port in start_port..start_port+100 {
        let addr = SocketAddr::from(([0, 0, 0, 0], port));
        if TcpListener::bind(addr).await.is_ok() {
            return Some(port);
        }
    }
    None
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("Starting logistics engine...");

    let app = Router::new()
        .route("/health", get(health));

    println!("Router configured");

    let port = 3000; // Fixed port for container
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Binding to address: {}", addr);
    
    let listener = TcpListener::bind(addr).await?;
    println!("Listener bound successfully on port {}", port);
    
    println!("Starting server...");
    axum::serve(listener, app).await?;
    
    Ok(())
}
