#!/bin/bash


# Default values
USERNAME="admin"
PASSWORD="mypassword"
DATABASE="health-auto-export"
ENVIRONMENT="production"
PORT="27017"


# Generate random tokens for authentication
READ_TOKEN=sk-$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
WRITE_TOKEN=sk-$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)

echo "Creating .env file..."
cat > .env << EOF
NODE_ENV=${ENVIRONMENT}
MONGO_HOST=hae-mongo
MONGO_USERNAME=${USERNAME}
MONGO_PASSWORD=${PASSWORD}
MONGO_DB=${DATABASE}
MONGO_PORT=${PORT}
READ_TOKEN=${READ_TOKEN}
WRITE_TOKEN=${WRITE_TOKEN}
EOF

echo "Environment configuration saved to .env file ✅"
echo "Generated READ_TOKEN: ${READ_TOKEN}"
echo "Generated WRITE_TOKEN: ${WRITE_TOKEN}"
echo "Store these tokens securely!"