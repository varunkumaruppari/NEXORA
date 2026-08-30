# RESOLV AI 🤖⚡

**AI-powered Multi-Agent Customer Problem Resolution Platform for E-Commerce**

RESOLV AI is a hackathon project built to transform e-commerce customer support. It leverages a multi-agent AI framework to analyze customer complaints, inspect evidence (text & images), determine risk levels, execute automatic resolutions for straightforward cases, and seamlessly escalate complex cases to human support teams with AI-generated incident reports.

---

## 🛠️ Mandatory Tech Stack

- **Frontend**: React.js (Vite), React Router v6, Tailwind CSS, Axios, Lucide React icons
- **Backend**: Node.js, Express.js, JWT Authentication, bcryptjs, Express Validator
- **Database**: MongoDB & Mongoose
- **Artificial Intelligence**: Google Gemini API (Strictly kept in backend `.env`)

---

## 📂 Project Structure

```
resolv-ai/
├── client/                 # React Vite Frontend Application
│   ├── src/
│   │   ├── components/     # Reusable UI components (Navbar, etc.)
│   │   ├── context/        # React Context (AuthContext, etc.)
│   │   ├── hooks/          # Custom React Hooks
│   │   ├── pages/          # 7 Core Application Pages
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx         # React Router navigation setup
│   │   ├── index.css       # Tailwind & custom CSS variables
│   │   └── main.jsx        # App entry point
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                 # Express Node.js Backend Server
│   ├── src/
│   │   ├── agents/         # Multi-agent AI logic modules (placeholder)
│   │   ├── config/         # DB & Environment configs
│   │   ├── controllers/    # API Request Controllers (placeholder)
│   │   ├── middleware/     # Error Handling & Auth Middleware
│   │   ├── models/         # Mongoose Database Models (placeholder)
│   │   ├── routes/         # Express API Routes
│   │   ├── services/       # Core Business Logic & Gemini AI Services (placeholder)
│   │   ├── utils/          # Helper utilities
│   │   ├── app.js          # Express app configuration
│   │   └── server.js       # Express server initialization
│   ├── package.json
│   └── .env.example
│
├── .gitignore              # Git ignore configuration
└── README.md               # Project documentation
```

---

## 🚀 Quick Start Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Optional for initial health check, required for full auth/data features.

---

### 1. Backend Setup (`server`)

1. Open terminal and navigate to the server folder:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` to add your optional `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`.*

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will run on `http://localhost:5000`.*
   *Verify API health by visiting `http://localhost:5000/api/health`.*

---

### 2. Frontend Setup (`client`)

1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will run on `http://localhost:5173`.*

---

## 🔗 Initial Routes

| Route | View Description |
|---|---|
| `/` | Landing Page |
| `/login` | User Login Page |
| `/register` | User Registration Page |
| `/chat` | Customer Chat & Problem Resolution Panel |
| `/dashboard` | Customer Service Team Dashboard |
| `/cases/:id` | Case Details & AI Structured Escalation Report |
| `*` | 404 Not Found Page |
