use crate::config;
use crate::error::AppError;
use crate::models::dto::order::CreateOrderDto;
use crate::models::dto::order_item::CreateOrderItemDto;
use crate::models::dto::payment::CreatePaymentInfoDto;
use crate::models::dto::shipping::CreateShippingInfoDto;
use crate::services::{CustomerService, InventoryService, OrderService};
use chrono::Utc;
use num_traits::ToPrimitive;
use rand::distr::Alphanumeric;
use rand::rngs::StdRng;
use rand::{prelude::*, Rng};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::{mpsc, Mutex};
use tokio::task::JoinHandle;
use tokio::time;
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct OrderProducerConfig {
    pub interval_seconds: u64,
    pub randomize_interval: bool,
    pub min_orders_per_interval: u32,
    pub max_orders_per_interval: u32,
    pub max_items_per_order: u32,
    pub enabled: bool,
}

impl Default for OrderProducerConfig {
    fn default() -> Self {
        Self {
            interval_seconds: 60,
            randomize_interval: true,
            min_orders_per_interval: 1,
            max_orders_per_interval: 5,
            max_items_per_order: 10,
            enabled: false,
        }
    }
}

impl From<config::OrderProducerConfig> for OrderProducerConfig {
    fn from(conf: config::OrderProducerConfig) -> Self {
        Self {
            interval_seconds: conf.interval_seconds,
            randomize_interval: conf.randomize_interval,
            min_orders_per_interval: conf.min_orders_per_interval,
            max_orders_per_interval: conf.max_orders_per_interval,
            max_items_per_order: conf.max_items_per_order,
            enabled: conf.enabled,
        }
    }
}

pub struct OrderProducerService {
    config: OrderProducerConfig,
    running: Arc<Mutex<bool>>,
    task_handle: Option<JoinHandle<()>>,
    shutdown_tx: Option<mpsc::Sender<()>>,
    order_service: Option<Arc<OrderService>>,
    customer_service: Option<Arc<CustomerService>>,
    inventory_service: Option<Arc<InventoryService>>,
}

impl OrderProducerService {
    pub fn new(config: OrderProducerConfig, customer_service: Arc<CustomerService>) -> Self {
        Self {
            config,
            running: Arc::new(Mutex::new(false)),
            task_handle: None,
            shutdown_tx: None,
            order_service: None,
            customer_service: Some(customer_service),
            inventory_service: None,
        }
    }

    pub fn with_order_service(mut self, order_service: Arc<OrderService>) -> Self {
        self.order_service = Some(order_service);
        self
    }

    pub fn with_customer_service(mut self, customer_service: Arc<CustomerService>) -> Self {
        self.customer_service = Some(customer_service);
        self
    }

    pub fn with_inventory_service(mut self, inventory_service: Arc<InventoryService>) -> Self {
        self.inventory_service = Some(inventory_service);
        self
    }

    pub async fn start(&mut self) -> Result<(), AppError> {
        let mut running = self.running.lock().await;
        if *running {
            return Ok(());
        }

        let (shutdown_tx, mut shutdown_rx) = mpsc::channel::<()>(1);
        self.shutdown_tx = Some(shutdown_tx);

        let config = self.config.clone();
        let running_clone = self.running.clone();
        let order_service = self.order_service.clone();
        let customer_service = self.customer_service.clone();
        let inventory_service = self.inventory_service.clone();

        let handle = tokio::spawn(async move {
            *running_clone.lock().await = true;
            info!("Order producer service started");

            let mut interval = time::interval(Duration::from_secs(config.interval_seconds));

            loop {
                tokio::select! {
                    _ = interval.tick() => {
                        if let Err(e) = Self::generate_and_publish_orders(&config, order_service.clone(), customer_service.clone(), inventory_service.clone()).await {
                            error!("Failed to generate and publish orders: {}", e);
                        }
                    }
                    _ = shutdown_rx.recv() => {
                        info!("Shutting down order producer service");
                        break;
                    }
                }
            }

            *running_clone.lock().await = false;
            info!("Order producer service stopped");
        });

        self.task_handle = Some(handle);
        *running = true;

        Ok(())
    }

    pub async fn stop(&mut self) -> Result<(), AppError> {
        let mut running = self.running.lock().await;
        if !*running {
            return Ok(());
        }

        if let Some(tx) = self.shutdown_tx.take() {
            let _ = tx.send(()).await;
        }

        if let Some(handle) = self.task_handle.take() {
            if !handle.is_finished() {
                handle.abort();
            }
        }

        *running = false;
        Ok(())
    }

    pub async fn is_running(&self) -> bool {
        *self.running.lock().await
    }

    async fn generate_and_publish_orders(
        config: &OrderProducerConfig,
        order_service: Option<Arc<OrderService>>,
        customer_service: Option<Arc<CustomerService>>,
        inventory_service: Option<Arc<InventoryService>>,
    ) -> Result<(), AppError> {
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);

        let num_orders = if config.min_orders_per_interval == config.max_orders_per_interval {
            config.min_orders_per_interval
        } else {
            rng.gen_range(config.min_orders_per_interval..=config.max_orders_per_interval)
        };

        info!("Attempting to generate {} orders", num_orders);

        let has_customers = if let Some(customer_service) = &customer_service {
            match customer_service.get_all_customers(1, 1, None).await {
                Ok(customers) if !customers.is_empty() => true,
                _ => {
                    warn!("No customers available in the system. Skipping order generation.");
                    false
                }
            }
        } else {
            warn!("No customer service provided. Skipping order generation.");
            false
        };
        println!("has_customers: {}", has_customers);

        if !has_customers {
            info!("Order generation skipped due to missing customers.");
            return Ok(());
        }

        // Next, check if we have any inventory items
        let has_inventory = if let Some(inventory_service) = &inventory_service {
            match inventory_service.get_all_items(1, 0, None).await {
                Ok(items) if !items.is_empty() => true,
                _ => match inventory_service.get_random_item().await {
                    Ok(Some(_)) => true,
                    _ => {
                        println!("No inventory items available in the system. Skipping order generation.");
                        warn!("No inventory items available in the system. Skipping order generation.");
                        false
                    }
                },
            }
        } else {
            warn!("No inventory service provided. Skipping order generation.");
            false
        };

        if !has_inventory {
            info!("Order generation skipped due to missing inventory items.");
            return Ok(());
        }

        info!(
            "Found customers and inventory. Generating {} orders",
            num_orders
        );

        let mut successful_orders = 0;
        for _ in 0..num_orders {
            match Self::generate_random_order(
                config,
                customer_service.clone(),
                inventory_service.clone(),
            )
            .await
            {
                Ok(order_dto) => {
                    if let Some(order_service) = &order_service {
                        match order_service.create_order(order_dto).await {
                            Ok(order) => {
                                info!("Created order: {}", order.id);
                                successful_orders += 1;
                            }
                            Err(e) => {
                                error!("Failed to create order: {}", e);
                            }
                        }
                    } else {
                        info!("Order producer would create an order (no OrderService provided)");
                        successful_orders += 1;
                    }
                }
                Err(e) => {
                    error!("Failed to generate order: {}", e);
                }
            }

            if num_orders > 1 && config.randomize_interval {
                let new_seed = Instant::now().elapsed().as_nanos() as u64;
                let mut delay_rng = StdRng::seed_from_u64(new_seed);
                let delay = delay_rng.gen_range(100..1000);
                time::sleep(Duration::from_millis(delay)).await;
            }
        }

        info!(
            "Successfully created {} out of {} attempted orders",
            successful_orders, num_orders
        );
        Ok(())
    }

    async fn generate_random_order(
        config: &OrderProducerConfig,
        customer_service: Option<Arc<CustomerService>>,
        inventory_service: Option<Arc<InventoryService>>,
    ) -> Result<CreateOrderDto, AppError> {
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);

        let customer_id = if let Some(customer_service) = &customer_service {
            match customer_service.get_random_customer().await {
                Ok(Some(customer)) => {
                    info!("Using random customer: {}", customer.id);
                    customer.id.to_string()
                }
                _ => {
                    info!("No customer found with random selection, looking for any customer in the system");
                    match customer_service.get_all_customers(1, 1, None).await {
                        Ok(customers) if !customers.is_empty() => {
                            info!("Using first available customer: {}", customers[0].id);
                            customers[0].id.to_string()
                        }
                        _ => {
                            warn!("No customers available in the system. Order creation will fail due to foreign key constraint");

                            let random_id = Uuid::new_v4();
                            info!("Attempting with random UUID: {}", random_id);

                            match customer_service.customer_exists(&random_id).await {
                                Ok(true) => random_id.to_string(),
                                _ => {
                                    error!("Cannot create order: no valid customer ID found");
                                    Uuid::new_v4().to_string()
                                }
                            }
                        }
                    }
                }
            }
        } else {
            warn!("No customer service provided. Order creation will fail due to foreign key constraint");
            Uuid::new_v4().to_string()
        };

        let num_items = rng.gen_range(1..=5);
        let mut order_items = Vec::new();
        let mut valid_items_found = false;

        if let Some(inventory_service) = &inventory_service {
            // Try multiple methods to get valid inventory items
            let inventory_items = match inventory_service.get_all_items(100, 0, None).await {
                Ok(items) if !items.is_empty() => {
                    info!("Found {} inventory items to choose from", items.len());
                    valid_items_found = true;
                    items
                }
                _ => {
                    info!("No items found with get_all_items, trying random item selection");
                    Vec::new()
                }
            };

            if valid_items_found {
                for _ in 0..num_items {
                    // Randomly select from the valid inventory items
                    let item_index = rng.gen_range(0..inventory_items.len());
                    let item = &inventory_items[item_index];

                    let quantity = rng.gen_range(1..=3);
                    let unit_price = item.price.to_f64().unwrap_or(10.0);

                    order_items.push(CreateOrderItemDto {
                        product_id: item.id,
                        sku: item.sku.clone(),
                        name: item.name.clone(),
                        quantity,
                        unit_price,
                    });
                }
            } else {
                // Fallback to get_random_item if get_all_items didn't work
                for _ in 0..num_items {
                    match inventory_service.get_random_item().await {
                        Ok(Some(item)) => {
                            info!("Using random inventory item: {}", item.id);
                            let quantity = rng.gen_range(1..=3);
                            let unit_price = item.price.to_f64().unwrap_or(10.0);

                            order_items.push(CreateOrderItemDto {
                                product_id: item.id,
                                sku: item.sku.clone(),
                                name: item.name.clone(),
                                quantity,
                                unit_price,
                            });
                            valid_items_found = true;
                        }
                        _ => {
                            warn!("Failed to get a random inventory item");
                            continue;
                        }
                    }
                }
            }
        } else {
            warn!(
                "No inventory service provided. Cannot create order items with valid product IDs."
            );
        }

        // If no valid items were found or added, return an error
        if order_items.is_empty() {
            return Err(AppError::ValidationError(
                "Cannot create order without valid inventory items".to_string(),
            ));
        }

        let shipping_info = CreateShippingInfoDto {
            order_id: Uuid::new_v4(),
            address_line1: format!(
                "{} {} St",
                rng.gen_range(100..9999),
                Self::random_street_name()
            ),
            address_line2: if rng.gen_bool(0.3) {
                Some(format!("Apt {}", rng.gen_range(1..100)))
            } else {
                None
            },
            city: Self::random_city(),
            state: Self::random_state(),
            postal_code: format!("{:05}", rng.gen_range(10000..99999)),
            country: "US".to_string(),
            recipient_name: format!("{} {}", Self::random_first_name(), Self::random_last_name()),
            recipient_phone: Some(format!(
                "+1{}{}{}",
                rng.gen_range(200..999),
                rng.gen_range(100..999),
                rng.gen_range(1000..9999)
            )),
            shipping_method: Self::random_shipping_method(),
            shipping_cost: rng.gen_range(5.0..20.0),
        };

        let payment_info = CreatePaymentInfoDto {
            order_id: Uuid::new_v4(),
            payment_method: Self::random_payment_method(),
            amount: order_items
                .iter()
                .map(|item| item.unit_price * item.quantity as f64)
                .sum(),
            currency: "USD".to_string(),
            transaction_id: Some(format!("TXN-{}", Self::random_string(10))),
            payment_date: Some(Utc::now()),
        };

        Ok(CreateOrderDto {
            customer_id,
            items: order_items,
            shipping_info,
            payment_info,
            notes: None,
            currency: "USD".to_string(),
        })
    }

    fn random_street_name() -> String {
        let streets = [
            "Main",
            "Oak",
            "Pine",
            "Maple",
            "Cedar",
            "Elm",
            "Washington",
            "Lake",
            "Hill",
            "Park",
        ];

        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let street = streets[rng.gen_range(0..streets.len())];
        street.to_string()
    }

    fn random_city() -> String {
        let cities = [
            "New York",
            "Los Angeles",
            "Chicago",
            "Houston",
            "Phoenix",
            "Philadelphia",
            "San Antonio",
            "San Diego",
            "Dallas",
            "San Jose",
            "Austin",
            "Jacksonville",
            "Fort Worth",
            "Columbus",
            "San Francisco",
            "Charlotte",
            "Indianapolis",
            "Seattle",
            "Denver",
            "Boston",
        ];
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let city = cities[rng.gen_range(0..cities.len())];
        city.to_string()
    }

    fn random_state() -> String {
        let states = [
            "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN",
            "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV",
            "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN",
            "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
        ];
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let state = states[rng.gen_range(0..states.len())];
        state.to_string()
    }

    fn random_shipping_method() -> String {
        let methods = ["Standard", "Express", "Next Day", "Two Day", "Economy"];
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let method = methods[rng.gen_range(0..methods.len())];
        method.to_string()
    }

    fn random_payment_method() -> String {
        let methods = [
            "Credit Card",
            "Debit Card",
            "PayPal",
            "Apple Pay",
            "Google Pay",
        ];
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let method = methods[rng.gen_range(0..methods.len())];
        method.to_string()
    }

    fn random_string(len: usize) -> String {
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        rng.sample_iter(&Alphanumeric)
            .take(len)
            .map(char::from)
            .collect()
    }

    fn random_first_name() -> String {
        let first_names = [
            "James",
            "Mary",
            "John",
            "Patricia",
            "Robert",
            "Jennifer",
            "Michael",
            "Linda",
            "William",
            "Elizabeth",
            "David",
            "Susan",
            "Richard",
            "Jessica",
            "Joseph",
            "Sarah",
            "Thomas",
            "Karen",
            "Charles",
            "Nancy",
            "Christopher",
            "Lisa",
            "Daniel",
            "Betty",
            "Matthew",
            "Dorothy",
            "Anthony",
            "Sandra",
            "Mark",
            "Ashley",
            "Donald",
            "Kimberly",
        ];
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let name = first_names[rng.gen_range(0..first_names.len())];
        name.to_string()
    }

    fn random_last_name() -> String {
        let last_names = [
            "Smith",
            "Johnson",
            "Williams",
            "Jones",
            "Brown",
            "Davis",
            "Miller",
            "Wilson",
            "Moore",
            "Taylor",
            "Anderson",
            "Thomas",
            "Jackson",
            "White",
            "Harris",
            "Martin",
            "Thompson",
            "Garcia",
            "Martinez",
            "Robinson",
            "Clark",
            "Rodriguez",
            "Lewis",
            "Lee",
            "Walker",
            "Hall",
            "Allen",
            "Young",
            "Hernandez",
            "King",
            "Wright",
            "Lopez",
        ];
        let seed = Instant::now().elapsed().as_nanos() as u64;
        let mut rng = StdRng::seed_from_u64(seed);
        let name = last_names[rng.gen_range(0..last_names.len())];
        name.to_string()
    }
}
