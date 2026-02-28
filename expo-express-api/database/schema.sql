-- PostgreSQL Script

CREATE TABLE Users (
  id SERIAL PRIMARY KEY,
  userId VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Shops (
  id SERIAL PRIMARY KEY,
  shopName VARCHAR(255) NOT NULL CHECK (char_length(shopName) >= 3),
  shopType VARCHAR(50) NOT NULL CHECK (shopType IN ('Restaurant', 'Vegetables', 'Grocery')),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL DEFAULT 'Kakinada' CHECK (city = 'Kakinada'),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Orders (
  id SERIAL PRIMARY KEY,
  orderId VARCHAR(50) UNIQUE NOT NULL,
  userId VARCHAR(50) NOT NULL REFERENCES Users(userId),
  shopId INTEGER NOT NULL REFERENCES Shops(id),
  mobileNumber VARCHAR(10) NOT NULL,
  distance DECIMAL(10, 2) NOT NULL,
  deliveryFee DECIMAL(10, 2) NOT NULL,
  cartItems JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  totalAmount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Confirmed',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
