#!/bin/bash

# GitStatus Development Starter Script
# This script starts both the backend and frontend servers in development mode

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== GitStatus Development Environment ===${NC}"
echo -e "${BLUE}Starting development servers...${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed. Please install Node.js and npm.${NC}"
    exit 1
fi

# Check if both frontend and backend package.json exist
if [ ! -f "./frontend/package.json" ]; then
    echo -e "${RED}Error: frontend/package.json not found. Are you in the right directory?${NC}"
    exit 1
fi

if [ ! -f "./backend/package.json" ]; then
    echo -e "${RED}Error: backend/package.json not found. Are you in the right directory?${NC}"
    exit 1
fi

# Check if .env file exists in backend, if not copy from example
if [ ! -f "./backend/.env" ]; then
    echo -e "${YELLOW}No .env file found in backend directory.${NC}"
    if [ -f "./backend/.env.example" ]; then
        echo -e "${BLUE}Copying .env.example to .env...${NC}"
        cp ./backend/.env.example ./backend/.env
        echo -e "${YELLOW}Please update the .env file with your credentials before proceeding.${NC}"
        echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
        read -r answer
        if [[ ! "$answer" =~ ^[Yy]$ ]]; then
            echo -e "${RED}Exiting.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}No .env.example file found in backend directory. Please create a .env file.${NC}"
        exit 1
    fi
fi

# Create named pipes for output handling
BACKEND_PIPE=$(mktemp -u)
FRONTEND_PIPE=$(mktemp -u)
mkfifo "$BACKEND_PIPE"
mkfifo "$FRONTEND_PIPE"

# Function to handle script termination
cleanup() {
  echo -e "${YELLOW}Shutting down servers...${NC}"
  # Kill all child processes
  pkill -P $$
  # Remove named pipes
  rm -f "$BACKEND_PIPE" "$FRONTEND_PIPE"
  echo -e "${GREEN}Servers stopped. Goodbye!${NC}"
  exit 0
}

# Register cleanup on script termination
trap cleanup SIGINT SIGTERM

# Start the backend server
echo -e "${GREEN}Starting GitStatus backend...${NC}"
cd backend
# Start backend with output to the pipe
npm run dev > "$BACKEND_PIPE" 2>&1 &

# Start the frontend server
echo -e "${GREEN}Starting GitStatus frontend...${NC}"
cd ../frontend
# Start frontend with output to the pipe
npm start > "$FRONTEND_PIPE" 2>&1 &

# Process and display backend output with prefix
cat "$BACKEND_PIPE" | while read -r line; do
  echo -e "${CYAN}[Backend]${NC} $line"
done &

# Process and display frontend output with prefix
cat "$FRONTEND_PIPE" | while read -r line; do
  echo -e "${PURPLE}[Frontend]${NC} $line"
done &

# Keep script running
echo -e "${GREEN}GitStatus is running.${NC}"
echo -e "${BLUE}Backend server: http://localhost:5000${NC}"
echo -e "${BLUE}Frontend server: http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers.${NC}"
wait
