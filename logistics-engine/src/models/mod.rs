pub mod customer;
pub mod dto;
pub mod entities;
pub mod inventory;
pub mod order;
pub mod order_item;
pub mod payment;
pub mod shipping;
pub mod warehouse;

// Re-export commonly used types
pub use customer::{CreateCustomerDto, Customer, UpdateCustomerDto};
pub use inventory::{
    CreateReservationDto, InventoryReservation, ReservationStatus, UpdateReservationDto,
};
pub use order::{CreateOrderDto, CreateOrderItemDto, Order, OrderStatus, UpdateOrderDto};
pub use order_item::{OrderItem, UpdateOrderItemDto};
pub use payment::{CreatePaymentInfoDto, PaymentInfo, PaymentStatus, UpdatePaymentInfoDto};
pub use shipping::{CreateShippingInfoDto, ShippingInfo, UpdateShippingInfoDto};
