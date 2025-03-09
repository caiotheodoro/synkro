use crate::models::entities::OrderStatus;
use crate::models::UpdateOrderDto;
use crate::services::OrderService;
use chrono::{DateTime, Utc};
use futures_util::StreamExt;
use prost_types::Timestamp;
use std::sync::Arc;
use tonic::{Request, Response, Status};
use uuid::Uuid;

// Import the proto-generated code
use crate::proto::order::{
    order_service_server::{OrderService as GrpcOrderService, OrderServiceServer},
    CreateOrderRequest, GetOrderRequest, ListOrdersRequest, ListOrdersResponse, OrderResponse,
    OrderStatus as GrpcOrderStatus, OrderStatusEvent, PaymentInfo, ShippingInfo,
    StreamOrderUpdatesRequest, UpdateOrderStatusRequest,
};

pub struct OrderGrpcService {
    order_service: Arc<OrderService>,
}

impl OrderGrpcService {
    pub fn new(order_service: Arc<OrderService>) -> Self {
        Self { order_service }
    }

    pub fn into_service(self) -> OrderServiceServer<Self> {
        OrderServiceServer::new(self)
    }

    fn to_grpc_status(status: &OrderStatus) -> i32 {
        match status {
            OrderStatus::Pending => 1,
            OrderStatus::Processing => 2,
            OrderStatus::Shipped => 3,
            OrderStatus::Delivered => 4,
            OrderStatus::Cancelled => 5,
            OrderStatus::Returned => 6,
        }
    }

    fn from_grpc_status(status: i32) -> OrderStatus {
        match status {
            1 => OrderStatus::Pending,
            2 => OrderStatus::Processing,
            3 => OrderStatus::Shipped,
            4 => OrderStatus::Delivered,
            5 => OrderStatus::Cancelled,
            6 => OrderStatus::Returned,
            _ => OrderStatus::Pending, // Default to pending for unknown status
        }
    }

    // Helper method to convert DateTime<Utc> to Timestamp
    fn to_timestamp(datetime: DateTime<Utc>) -> Timestamp {
        Timestamp {
            seconds: datetime.timestamp(),
            nanos: datetime.timestamp_subsec_nanos() as i32,
        }
    }
}

#[tonic::async_trait]
impl GrpcOrderService for OrderGrpcService {
    async fn create_order(
        &self,
        request: Request<CreateOrderRequest>,
    ) -> Result<Response<OrderResponse>, Status> {
        let req = request.into_inner();

        // TODO: Implement full conversion from gRPC CreateOrderRequest to internal CreateOrderDto
        // This is a simplified placeholder implementation

        Err(Status::unimplemented("create_order not yet implemented"))
    }

    async fn get_order(
        &self,
        request: Request<GetOrderRequest>,
    ) -> Result<Response<OrderResponse>, Status> {
        let req = request.into_inner();

        let order_id = match Uuid::parse_str(&req.order_id) {
            Ok(id) => id,
            Err(e) => return Err(Status::invalid_argument(format!("Invalid order ID: {}", e))),
        };

        let order = self
            .order_service
            .get_order_by_id(order_id)
            .await
            .map_err(|e| Status::internal(format!("Failed to get order: {}", e)))?;

        // TODO: Convert order to OrderResponse
        // This is a simplified placeholder implementation

        Err(Status::unimplemented("get_order not yet implemented"))
    }

    async fn update_order_status(
        &self,
        request: Request<UpdateOrderStatusRequest>,
    ) -> Result<Response<OrderResponse>, Status> {
        let req = request.into_inner();

        let order_id = match Uuid::parse_str(&req.order_id) {
            Ok(id) => id,
            Err(e) => return Err(Status::invalid_argument(format!("Invalid order ID: {}", e))),
        };

        let status = Self::from_grpc_status(req.new_status);
        let notes = Some(req.status_notes);

        let order = self
            .order_service
            .update_order_status(order_id, status, notes)
            .await
            .map_err(|e| Status::internal(format!("Failed to update order status: {}", e)))?;

        let response = OrderResponse {
            id: order.id.to_string(),
            customer_id: order.customer_id.to_string(),
            status: Self::to_grpc_status(&order.status),
            total_amount: order.total_amount.to_string().parse::<f64>().unwrap_or(0.0),
            items: vec![],
            shipping_info: None,
            payment_info: None,
            created_at: Some(Self::to_timestamp(order.created_at)),
            updated_at: Some(Self::to_timestamp(order.updated_at)),
            tracking_number: order.tracking_number.clone().unwrap_or_default(),
            notes: order.notes.clone().unwrap_or_default(),
        };

        Ok(Response::new(response))
    }

    async fn list_orders(
        &self,
        request: Request<ListOrdersRequest>,
    ) -> Result<Response<ListOrdersResponse>, Status> {
        // TODO: Implement this method
        Err(Status::unimplemented("list_orders not yet implemented"))
    }

    type StreamOrderUpdatesStream =
        tokio_stream::wrappers::ReceiverStream<Result<OrderStatusEvent, Status>>;

    async fn stream_order_updates(
        &self,
        request: Request<StreamOrderUpdatesRequest>,
    ) -> Result<
        Response<tokio_stream::wrappers::ReceiverStream<Result<OrderStatusEvent, Status>>>,
        Status,
    > {
        // TODO: Implement real-time order updates streaming
        // Will be implemented in a future phase
        Err(Status::unimplemented(
            "stream_order_updates not yet implemented",
        ))
    }
}
