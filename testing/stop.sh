#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.server.pid"

if [ ! -f "$PID_FILE" ]; then
    echo "Testing dashboard is not running."
    exit 1
fi

PID=$(cat "$PID_FILE")

if kill "$PID" 2>/dev/null; then
    rm "$PID_FILE"
    echo "Testing dashboard stopped successfully."
else
    echo "Process not found. Cleaning up..."
    rm "$PID_FILE"
    echo "Testing dashboard stopped."
fi
