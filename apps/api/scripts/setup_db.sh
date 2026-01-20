#!/bin/bash

# Setup PostgreSQL database for Animation Studio

echo "🚀 Setting up Animation Studio Database"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Install it with:"
    echo "  macOS: brew install postgresql@15"
    echo "  Linux: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

# Database configuration
DB_NAME="animation_studio"
DB_USER="animation_user"
DB_PASSWORD="animation_password_change_me"

echo "📦 Creating database and user..."

# Create user and database
psql postgres << EOF
-- Create user if not exists
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_user WHERE usename = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
  END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE $DB_NAME'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo "✅ Database created successfully!"
echo ""
echo "📝 Add this to your .env file:"
echo "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost/$DB_NAME"
echo ""
echo "🔧 Next steps:"
echo "1. Update your .env file with the DATABASE_URL above"
echo "2. Run: cd apps/api && uv run python -m app.database.init_db"
echo "3. Start the server: uv run uvicorn app.main:app --reload"