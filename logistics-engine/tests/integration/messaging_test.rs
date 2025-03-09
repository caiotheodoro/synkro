#[cfg(test)]
mod messaging_tests {
    use logistics_engine::config;
    use logistics_engine::mq::events::{EventType, OrderCreatedEvent};
    use logistics_engine::mq::publisher;
    use std::sync::Once;
    use uuid::Uuid;

    static INIT: Once = Once::new();

    async fn setup() {
        INIT.call_once(|| {
            // Initialize config
            config::init();

            // Setup test environment
            // ...
        });

        // Initialize RabbitMQ connections
        if let Err(e) = logistics_engine::mq::init_rabbitmq().await {
            eprintln!("Failed to initialize RabbitMQ: {}", e);
        }
    }

    #[tokio::test]
    async fn test_publish_event() {
        setup().await;

        // Create a test event
        let order_id = Uuid::new_v4();
        let customer_id = Uuid::new_v4();

        let event_data = OrderCreatedEvent {
            order_id,
            customer_id,
            status: "Pending".to_string(),
            total_amount: "100.00".to_string(),
            items_count: 2,
        };

        // Publish the event
        let result =
            publisher::publish_event(EventType::OrderCreated, "test.order.created", event_data)
                .await;

        // Assert that the event was published successfully
        assert!(result.is_ok(), "Failed to publish event: {:?}", result);
    }

    // Additional tests for consumers, dead letter queues, etc. would go here
}
