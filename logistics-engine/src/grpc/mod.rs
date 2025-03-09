pub mod inventory;
pub mod order;

use crate::error::AppError;
use std::sync::Arc;
use tokio::sync::OnceCell;

static INVENTORY_CLIENT: OnceCell<Arc<inventory::client::InventoryClient>> = OnceCell::const_new();

pub async fn init_grpc_clients() -> Result<(), AppError> {
    let inventory_client = inventory::client::InventoryClient::new()
        .await
        .map_err(|e| {
            AppError::GrpcError(format!("Failed to initialize inventory client: {}", e))
        })?;

    INVENTORY_CLIENT
        .set(Arc::new(inventory_client))
        .map_err(|_| {
            AppError::InternalServerError("INVENTORY_CLIENT already initialized".to_string())
        })?;

    Ok(())
}

pub async fn get_inventory_client() -> Result<Arc<inventory::client::InventoryClient>, AppError> {
    if let Some(client) = INVENTORY_CLIENT.get() {
        return Ok(client.clone());
    }

    let client = inventory::client::InventoryClient::new()
        .await
        .map_err(|e| {
            AppError::GrpcError(format!("Failed to initialize inventory client: {}", e))
        })?;

    let client = Arc::new(client);

    // Try to set the client, but it's okay if it was already set by another thread
    let _ = INVENTORY_CLIENT.set(client.clone());

    Ok(client)
}
