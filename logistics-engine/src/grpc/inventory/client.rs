use crate::config::get as get_config;
use std::str::FromStr;
use std::time::Duration;
use tonic::transport::{Channel, Endpoint};

// Import the proto-generated code
use crate::proto::inventory::{
    inventory_service_client::InventoryServiceClient, CommitReservationRequest,
    CommitReservationResponse, InventoryLevelsRequest, InventoryLevelsResponse, ProductItem,
    ReleaseStockRequest, ReleaseStockResponse, StockReservationRequest, StockReservationResponse,
};

pub struct InventoryClient {
    client: InventoryServiceClient<Channel>,
}

impl InventoryClient {
    pub async fn new() -> Result<Self, tonic::transport::Error> {
        let config = get_config();
        let endpoint = Endpoint::from_str(&config.grpc.inventory_url)?
            .timeout(Duration::from_secs(10))
            .connect_timeout(Duration::from_secs(5))
            .tcp_keepalive(Some(Duration::from_secs(30)));

        let client = InventoryServiceClient::connect(endpoint).await?;
        Ok(Self { client })
    }

    pub async fn check_and_reserve_stock(
        &self,
        order_id: String,
        items: Vec<ProductItem>,
        warehouse_id: String,
    ) -> Result<StockReservationResponse, tonic::Status> {
        let request = StockReservationRequest {
            order_id,
            items,
            warehouse_id,
        };

        let mut client = self.client.clone();
        let response = client.check_and_reserve_stock(request).await?;
        Ok(response.into_inner())
    }

    pub async fn release_reserved_stock(
        &self,
        reservation_id: String,
        order_id: String,
        reason: String,
    ) -> Result<ReleaseStockResponse, tonic::Status> {
        let request = ReleaseStockRequest {
            reservation_id,
            order_id,
            reason,
        };

        let mut client = self.client.clone();
        let response = client.release_reserved_stock(request).await?;
        Ok(response.into_inner())
    }

    pub async fn commit_reservation(
        &self,
        reservation_id: String,
        order_id: String,
    ) -> Result<CommitReservationResponse, tonic::Status> {
        let request = CommitReservationRequest {
            reservation_id,
            order_id,
        };

        let mut client = self.client.clone();
        let response = client.commit_reservation(request).await?;
        Ok(response.into_inner())
    }

    pub async fn get_inventory_levels(
        &self,
        product_ids: Vec<String>,
        skus: Vec<String>,
        warehouse_id: String,
    ) -> Result<InventoryLevelsResponse, tonic::Status> {
        let request = InventoryLevelsRequest {
            product_ids,
            skus,
            warehouse_id,
        };

        let mut client = self.client.clone();
        let response = client.get_inventory_levels(request).await?;
        Ok(response.into_inner())
    }
}
