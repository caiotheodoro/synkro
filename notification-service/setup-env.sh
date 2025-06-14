#!/bin/bash

echo "🚀 Synkro Notification Service Environment Setup"
echo "================================================"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << 'EOF'
# Server Configuration
PORT=3000
WEBSOCKET_PORT=3006
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://logistics:logistics_password@localhost:5433/logistics_engine
REDIS_URL=redis://localhost:6379

# Message Queue Configuration
RABBITMQ_URL=amqp://logistics:logistics_password@localhost:5672

# Email Configuration (SendGrid)
SENDGRID_API_KEY=
FROM_EMAIL=notifications@synkro.com

# Push Notification Configuration (Firebase)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# SMS Configuration (Twilio) - Optional
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Application URLs
DASHBOARD_URL=https://app.synkro.com
SUPPORT_EMAIL=support@synkro.com

# API Gateway Integration
API_GATEWAY_URL=http://localhost:3000

# Monitoring
PROMETHEUS_PORT=9090
LOG_LEVEL=info

# Development/Testing
ENABLE_MOCK_PROVIDERS=true
EOF
    echo "✅ Created .env file"
else
    echo "⚠️  .env file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. 📧 For SendGrid Email (Optional):"
echo "   - Sign up at https://sendgrid.com/"
echo "   - Create API key in Settings > API Keys"
echo "   - Add to .env: SENDGRID_API_KEY=SG.your_api_key_here"
echo ""
echo "2. 📱 For Firebase Push Notifications (Optional):"
echo "   - Go to https://console.firebase.google.com/"
echo "   - Create a project or select existing"
echo "   - Go to Project Settings > Service Accounts"
echo "   - Click 'Generate new private key'"
echo "   - Extract values from downloaded JSON:"
echo "     * FIREBASE_PROJECT_ID=your-project-id"
echo "     * FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com"
echo "     * FIREBASE_PRIVATE_KEY=\"-----BEGIN PRIVATE KEY-----\\nYOUR_KEY_HERE\\n-----END PRIVATE KEY-----\""
echo ""
echo "3. 🚀 Start the service:"
echo "   bun run dev"
echo ""
echo "Note: The service will work without these credentials - notifications will be logged to console instead." 