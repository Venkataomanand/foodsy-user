# Foodsy - Delivery Service

Foodsy is a modern, responsive delivery service website for food, vegetables, and groceries. Built with React.js, Tailwind CSS, and Firebase.

## Features

- **Storefront**: Home page with Hero section and Categories.
- **Products**: Browsing and filtering by category (Food, Vegetables, Grocery).
- **Cart & Checkout**: Full shopping cart functionality and mock checkout.
- **Order Tracking**: Visual status tracking of orders.
- **Admin Panel**: Basics for adding new products.
- **Authentication**: Login/Signup flows using Firebase Auth.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Create a project at [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password).
   - Enable **Firestore Database**.
   - Copy your Firebase config keys.
   - Open `src/firebase.js` and replace the placeholder values with your actual Firebase configuration.

3. **Run the Application**:
   ```bash
   npm run dev
   ```
   Open http://localhost:5173 to view it in the browser.

## Technologies

- React.js + Vite
- Tailwind CSS
- React Router DOM
- Context API (State Management)
- Framer Motion (Animations)
- Lucide React (Icons)
