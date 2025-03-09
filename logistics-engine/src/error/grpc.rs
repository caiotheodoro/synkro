use crate::error::AppError;
use tonic::Code;
use tonic::Status;

impl From<AppError> for Status {
    fn from(error: AppError) -> Self {
        match error {
            AppError::NotFound(entity, id) => Status::new(
                Code::NotFound,
                format!("Not found: {} with ID {}", entity, id),
            ),
            AppError::BadRequest(message) => Status::new(Code::InvalidArgument, message),
            AppError::ValidationError(message) => Status::new(Code::InvalidArgument, message),
            AppError::Unauthorized(message) => Status::new(Code::Unauthenticated, message),
            AppError::Forbidden(message) => Status::new(Code::PermissionDenied, message),
            AppError::Conflict(message) => Status::new(Code::AlreadyExists, message),
            AppError::DatabaseError(e) => {
                Status::new(Code::Internal, format!("Database error: {}", e))
            }
            AppError::RabbitMQError(message) => {
                Status::new(Code::Internal, format!("Message queue error: {}", message))
            }
            AppError::InventoryServiceError(message) => Status::new(
                Code::Internal,
                format!("Inventory service error: {}", message),
            ),
            AppError::GrpcError(message) => {
                Status::new(Code::Internal, format!("gRPC error: {}", message))
            }
            AppError::WebSocketError(message) => {
                Status::new(Code::Internal, format!("WebSocket error: {}", message))
            }
            AppError::InternalServerError(message) => Status::new(Code::Internal, message),
        }
    }
}
