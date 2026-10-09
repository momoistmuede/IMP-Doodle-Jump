#!/usr/bin/env bash

if ! command -v podman &> /dev/null; then
    echo "podman was not found. Please install podman or add it to the PATH."
    exit 1
fi

STATUS=$(podman machine ls | grep running)

if [ -z "$STATUS" ]; then
    echo "Podman machine has not started. Start now..."
    podman machine start
else
    echo "Podman machine is already running."
fi
