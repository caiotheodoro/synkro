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
  
  # Stop PostgreSQL for API Gateway Auth
  if [ -d "postgres/api-gateway-auth" ]; then
    cd postgres/api-gateway-auth || true
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


  cd postgres/api-gateway-auth || {
    print_message "$RED" "Failed to change to directory: postgres/api-gateway-auth"
    exit 1
  }
  docker-compose up -d
  cd "$ROOT_DIR" || exit 1
  print_message "$GREEN" "PostgreSQL for API Gateway Auth started."
  
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
  start_service "api-gateway-auth" "pnpm start:dev > \"$ROOT_DIR/logs/api-gateway-auth.log\" 2>&1" "$ROOT_DIR/api-gateway-auth"
  
  # Wait for API Gateway Auth to start
  print_message "$BLUE" "Waiting for API Gateway Auth to start..."
  sleep 5
  
  # Start Frontend Auth
  start_service "frontend-auth" "pnpm dev > \"$ROOT_DIR/logs/frontend-auth.log\" 2>&1" "$ROOT_DIR/frontend-auth"
  
  # Start Frontend Dashboard
  start_service "frontend-dashboard" "pnpm dev > \"$ROOT_DIR/logs/frontend-dashboard.log\" 2>&1" "$ROOT_DIR/frontend-dashboard"
  
  # Start Frontend Landing
  start_service "frontend-landing" "pnpm dev > \"$ROOT_DIR/logs/frontend-landing.log\" 2>&1" "$ROOT_DIR/frontend-landing"
  
  # Start Notification Service if it exists and has a package.json
  if [ -f "notification-service/package.json" ]; then
    start_service "notification-service" "npm start > \"$ROOT_DIR/logs/notification-service.log\" 2>&1" "$ROOT_DIR/notification-service"
  fi
  
  # Start AI ML Predictions if it exists
  if [ -d "ai-ml-predictions/app" ]; then
    # Check if venv exists, if not create it
    if [ ! -d "ai-ml-predictions/venv" ]; then
      print_message "$BLUE" "Setting up Python virtual environment for AI ML Predictions..."
      cd ai-ml-predictions || exit 1
      python -m venv venv
      source venv/bin/activate
      pip install -r requirements.txt
      deactivate
      cd "$ROOT_DIR" || exit 1
    fi
    
    start_service "ai-ml-predictions" "cd ai-ml-predictions && source venv/bin/activate && python -m app.main > \"$ROOT_DIR/logs/ai-ml-predictions.log\" 2>&1" "$ROOT_DIR"
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
      start_service "logistics-engine" "cd logistics-engine && cargo run > \"$ROOT_DIR/logs/logistics-engine.log\" 2>&1" "$ROOT_DIR"
    else
      print_message "$YELLOW" "Skipping Logistics Engine (Rust/Cargo not installed)."
    fi
  fi
  
  # Print summary
  print_message "$GREEN" "All services started successfully!"
  print_message "$BLUE" "Services running:"
  print_message "$BLUE" "  - PostgreSQL (API Gateway Auth): localhost:5432"
  print_message "$BLUE" "  - API Gateway Auth: Check logs/api-gateway-auth.log for port"
  print_message "$BLUE" "  - Frontend Auth: Check logs/frontend-auth.log for port"
  print_message "$BLUE" "  - Frontend Dashboard: localhost:3003"
  print_message "$BLUE" "  - Frontend Landing: Check logs/frontend-landing.log for port"
  
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