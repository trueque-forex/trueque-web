
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    business_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retailers (
    id VARCHAR(50) PRIMARY KEY,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(50),
    country VARCHAR(2),
    currency VARCHAR(3),
    retailer_wholesale_margin NUMERIC(10,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retailer_locations (
    store_id VARCHAR(100) PRIMARY KEY,
    retailer_id VARCHAR(50) REFERENCES retailers(id) ON DELETE CASCADE,
    city VARCHAR(255),
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS synthetic_liquidity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    retailer_id VARCHAR(50) REFERENCES retailers(id) ON DELETE CASCADE,
    available_balance NUMERIC(20,4) DEFAULT 0,
    currency VARCHAR(3),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(retailer_id)
);

