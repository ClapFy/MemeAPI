#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DASHBOARD_DIR="$SCRIPT_DIR/dashboard"
PID_FILE="$SCRIPT_DIR/.server.pid"

if [ -f "$PID_FILE" ]; then
    echo "Testing dashboard is already running!"
    echo "Visit: http://localhost:8080"
    exit 1
fi

echo "Starting MemeAPI Testing Dashboard..."
echo ""

cd "$DASHBOARD_DIR"

if command -v python3 &> /dev/null; then
    python3 -m http.server 8080 &
    echo $! > "$PID_FILE"
elif command -v python &> /dev/null; then
    python -m http.server 8080 &
    echo $! > "$PID_FILE"
elif command -v npx &> /dev/null; then
    npx http-server -p 8080 &
    echo $! > "$PID_FILE"
else
    echo "Error: No suitable server found. Please install Python or Node.js"
    exit 1
fi

echo "Testing dashboard started successfully!"
echo ""
echo "Visit: http://localhost:8080"
echo ""
echo "Features:"
echo "  - Test JSON endpoint with any parameters"
echo "  - Test Image-only endpoint"
echo "  - Health check monitoring"
echo "  - Request history tracking"
echo "  - Response statistics"
echo ""
echo "Press Ctrl+C or run ./stop.sh to stop the server"
