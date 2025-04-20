#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
is_port_in_use() {
  lsof -i:"$1" >/dev/null 2>&1
}

# Check for required tools
check_requirements() {
  print_message "$BLUE" "Checking requirements..."
  
  local missing_tools=()
  
  if ! command_exists docker; then
    missing_tools+=("docker")
  fi
  
  if ! command_exists docker-compose; then
    missing_tools+=("docker-compose")
  fi
  
  if ! command_exists pnpm; then
    missing_tools+=("pnpm")
  fi
  
  if ! command_exists node; then
    missing_tools+=("node")
  fi

  if ! command_exists python3; then
    missing_tools+=("python3")
  fi
  
  if [ ${#missing_tools[@]} -ne 0 ]; then
    print_message "$RED" "The following required tools are missing:"
    for tool in "${missing_tools[@]}"; do
      echo "  - $tool"
    done
    print_message "$YELLOW" "Please install the missing tools and try again."
    exit 1
  fi
  
  print_message "$GREEN" "All required tools are installed."
}

# Function to start a service
start_service() {
  local service_name=$1
  local command=$2
  local working_dir=$3
  
  print_message "$BLUE" "Starting $service_name..."
  
  # Change to the service directory
  cd "$working_dir" || {
    print_message "$RED" "Failed to change to directory: $working_dir"
    return 1
  }
  
  # Execute the command
  eval "$command" &
  
  # Store the PID
  local pid=$!
  echo "$pid" > "/tmp/synkro_${service_name}.pid"
  
  print_message "$GREEN" "$service_name started with PID $pid"
  
  # Change back to the root directory
  cd - > /dev/null || {
    print_message "$RED" "Failed to change back to the root directory"
    return 1
  }
}

# Function to stop all services
stop_services() {
  print_message "$YELLOW" "Stopping all services..."
  
  # Find all PID files
  for pid_file in /tmp/synkro_*.pid; do
    if [ -f "$pid_file" ]; then
      local pid=$(cat "$pid_file")
      local service_name=$(basename "$pid_file" | sed 's/synkro_//' | sed 's/\.pid//')
      
      print_message "$YELLOW" "Stopping $service_name (PID: $pid)..."
      kill -15 "$pid" 2>/dev/null || true
      rm -f "$pid_file"
    fi
  done
  
  # Stop Docker Compose services
  print_message "$YELLOW" "Stopping Docker Compose services..."
  
  # Stop services in api-gateway-auth
  if [ -d "api-gateway-auth" ]; then
    cd api-gateway-auth || true
    docker-compose down
    cd - > /dev/null || true
  fi
  
  # Stop ELK stack
  if [ -d "Elk" ]; then
    cd Elk || true
    docker-compose down
    cd - > /dev/null || true
  fi
  
  print_message "$GREEN" "All services stopped."
}

# Set up trap to stop services on exit
trap stop_services EXIT INT TERM

# Function to setup AI ML Predictions service
setup_ai_ml_predictions() {
  print_message "$BLUE" "Setting up AI ML Predictions service..."
  
  cd ai-ml-predictions || return 1
  
  # Check if .env exists, if not copy from example
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    print_message "$YELLOW" "No .env file found for AI ML Predictions. Copying from .env.example..."
    cp .env.example .env
    print_message "$GREEN" "Created .env file for AI ML Predictions."
  fi
  
  # Create and activate virtual environment
  if [ ! -d "venv" ]; then
    print_message "$BLUE" "Creating Python virtual environment..."
    python3 -m venv venv
  fi
  
  # Activate virtual environment and install dependencies
  source venv/bin/activate
  print_message "$BLUE" "Installing Python dependencies..."
  pip install -r requirements.txt
  deactivate
  
  cd - > /dev/null || return 1
  return 0
}

# Main function
main() {
  # Store the root directory
  ROOT_DIR=$(pwd)
  
  # Check requirements
  check_requirements
  
  # Create a directory for logs
  mkdir -p logs
  
  # Start PostgreSQL for API Gateway Auth
  print_message "$BLUE" "Starting PostgreSQL for API Gateway Auth..."
  print_message "$BLUE" "Current directory: $(pwd)"

  # Start Docker containers in api-gateway-auth
  print_message "$BLUE" "Starting Docker containers in api-gateway-auth..."
  cd api-gateway-auth || {
    print_message "$RED" "Failed to change to directory: api-gateway-auth"
    exit 1
  }
  docker-compose up -d
  cd "$ROOT_DIR" || exit 1
  print_message "$GREEN" "Docker containers in api-gateway-auth started."
  
  # Wait for PostgreSQL to be ready
  print_message "$BLUE" "Waiting for PostgreSQL to be ready..."
  MAX_RETRIES=30
  RETRY_COUNT=0
  
  # Get the Postgres container ID
  POSTGRES_CONTAINER=$(docker ps -qf "name=postgres" -f "name=api-gateway-auth-db" | head -n 1)
  
  if [ -z "$POSTGRES_CONTAINER" ]; then
    print_message "$YELLOW" "Could not find PostgreSQL container. Looking for any PostgreSQL container..."
    POSTGRES_CONTAINER=$(docker ps -qf "ancestor=postgres" | head -n 1)
  fi
  
  if [ -z "$POSTGRES_CONTAINER" ]; then
    print_message "$RED" "Could not find any PostgreSQL container. Check if the container is running."
    docker ps
    print_message "$YELLOW" "Continuing without PostgreSQL check..."
  else
    while ! docker exec $POSTGRES_CONTAINER pg_isready -U postgres 2>/dev/null; do
      RETRY_COUNT=$((RETRY_COUNT+1))
      if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        print_message "$RED" "Failed to connect to PostgreSQL after $MAX_RETRIES attempts. Continuing anyway..."
        break
      fi
      print_message "$YELLOW" "PostgreSQL not ready yet. Waiting 2 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
      sleep 2
    done
    print_message "$GREEN" "PostgreSQL is ready!"
  fi
  
  # Start ELK stack if .env file exists
  if [ -f "Elk/.env" ]; then
    print_message "$BLUE" "Starting ELK stack..."
    cd Elk || {
      print_message "$RED" "Failed to change to directory: Elk"
      exit 1
    }
    docker-compose up -d
    cd "$ROOT_DIR" || exit 1
    print_message "$GREEN" "ELK stack started."
  else
    print_message "$YELLOW" "Skipping ELK stack (no .env file found in Elk directory)."
    print_message "$YELLOW" "To start ELK, copy .env.example to .env in the Elk directory and run this script again."
  fi
  
  # Start API Gateway Auth service
  print_message "$BLUE" "Starting API Gateway Auth service on port 3000..."
  
  # First check if port 3000 is already in use
  if lsof -i:3000 >/dev/null 2>&1; then
    print_message "$RED" "Port 3000 is already in use. API Gateway Auth service may not start properly."
    print_message "$RED" "Please free up port 3000 and try again."
    lsof -i:3000
    print_message "$YELLOW" "Attempting to continue anyway..."
  fi
  
  cd api-gateway-auth || {
    print_message "$RED" "Failed to change to directory: api-gateway-auth"
    exit 1
  }
  
  # Check for .env file, copy from example if needed
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    print_message "$YELLOW" "No .env file found for API Gateway Auth. Copying from .env.example..."
    cp .env.example .env
    print_message "$GREEN" "Created .env file for API Gateway Auth."
  fi
  
  # Run migrations if needed
  print_message "$BLUE" "Running database migrations for API Gateway Auth..."
  pnpm migration:run || {
    print_message "$YELLOW" "Warning: Migrations may have failed, but continuing..."
  }
  
  cd "$ROOT_DIR" || exit 1
  
  # Start the service with explicit port setting
  start_service "api-gateway-auth" "PORT=3000 NODE_ENV=development pnpm start:dev > \"$ROOT_DIR/logs/api-gateway-auth.log\" 2>&1" "$ROOT_DIR/api-gateway-auth"
  
  # Start frontend services
  start_service "frontend-auth" "pnpm dev > \"$ROOT_DIR/logs/frontend-auth.log\" 2>&1" "$ROOT_DIR/frontend-auth"
  start_service "frontend-dashboard" "pnpm dev > \"$ROOT_DIR/logs/frontend-dashboard.log\" 2>&1" "$ROOT_DIR/frontend-dashboard"
  start_service "frontend-landing" "pnpm dev > \"$ROOT_DIR/logs/frontend-landing.log\" 2>&1" "$ROOT_DIR/frontend-landing"
  
  # Start Notification Service if it exists
  if [ -f "notification-service/package.json" ]; then
    start_service "notification-service" "npm start > \"$ROOT_DIR/logs/notification-service.log\" 2>&1" "$ROOT_DIR/notification-service"
  fi
  
  # Start AI ML Predictions if it exists
  if [ -d "ai-ml-predictions" ]; then
    if setup_ai_ml_predictions; then
      start_service "ai-ml-predictions" "cd ai-ml-predictions && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 3004 --reload > \"$ROOT_DIR/logs/ai-ml-predictions.log\" 2>&1" "$ROOT_DIR"
    else
      print_message "$RED" "Failed to setup AI ML Predictions service."
    fi
  fi
  
  # Start Inventory Sync Service if it exists (Go service)
  if [ -d "inventory-sync-service/src" ]; then
    if command_exists go; then
      start_service "inventory-sync-service" "cd inventory-sync-service && go run ./src/main.go > \"$ROOT_DIR/logs/inventory-sync-service.log\" 2>&1" "$ROOT_DIR"
    else
      print_message "$YELLOW" "Skipping Inventory Sync Service (Go not installed)."
    fi
  fi
  
  # Start Logistics Engine if it exists (Rust service)
  if [ -d "logistics-engine/src" ]; then
    if command_exists cargo; then
      start_service "logistics-engine" "cd logistics-engine && cargo run --bin logistics-engine > \"$ROOT_DIR/logs/logistics-engine.log\" 2>&1" "$ROOT_DIR"
    else
      print_message "$YELLOW" "Skipping Logistics Engine (Rust/Cargo not installed)."
    fi
  fi
  
  # Print summary
  print_message "$GREEN" "All services started successfully!"
  print_message "$BLUE" "Services running:"
  print_message "$BLUE" "  - PostgreSQL (API Gateway Auth): localhost:5436"
  print_message "$BLUE" "  - API Gateway Auth: localhost:3000"
  print_message "$BLUE" "  - Frontend Auth: localhost:3001"
  print_message "$BLUE" "  - Frontend Dashboard: localhost:3003"
  print_message "$BLUE" "  - Frontend Landing: localhost:3002"
  print_message "$BLUE" "  - AI ML Predictions: localhost:3004"
  
  if [ -f "Elk/.env" ]; then
    print_message "$BLUE" "  - ELK Stack: Check Elk/docker-compose.yml for ports"
  fi
  
  print_message "$YELLOW" "Logs are being written to the logs/ directory."
  print_message "$YELLOW" "Press Ctrl+C to stop all services."
  
  # Keep the script running
  while true; do
    sleep 1
  done
}

# Run the main function
main 