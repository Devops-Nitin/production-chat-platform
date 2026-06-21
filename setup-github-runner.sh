#!/bin/bash
set -e

RUNNER_VERSION="2.335.1"
RUNNER_DIR="$HOME/actions-runner"
REPO_URL="https://github.com/Devops-Nitin/production-chat-platform"

echo "Enter GitHub runner token:"
read -s RUNNER_TOKEN

mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

curl -o actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz \
-L https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

echo "4ef2f25285f0ae4477f1fe1e346db76d2f3ebf03824e2ddd1973a2819bf6c8cf  actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" \
| shasum -a 256 -c

tar xzf actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz

./config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "chatsphere-ai-local-runner" \
  --labels "self-hosted,linux,x64,chatsphere,kubernetes" \
  --unattended

echo "Runner configured successfully."
echo "Starting runner..."
./run.sh
