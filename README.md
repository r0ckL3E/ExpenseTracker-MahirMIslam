# Expense Tracker

A full-stack MERN application for tracking income and expenses with AI-powered categorization, real-time analytics, and data visualization.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)

## Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **Income Management**: Track income sources with amounts, dates, and custom icons
- **Expense Tracking**: Monitor expenses by category with detailed transaction history
- **Financial Dashboard**: Real-time analytics showing balance, trends, and recent transactions

### AI-Powered Features
- **Smart Categorization**: Hugging Face DistilBERT model automatically categorizes expenses from natural language descriptions
- **Confidence Scoring**: Auto-fill suggestions when AI confidence exceeds 70%
- **10 Predefined Categories**: Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Travel, Personal Care, Other

## Technology Stack

### Frontend
- **React 18**: Component-based UI with hooks and Context API
- **React Router v6**: Client-side routing and navigation
- **Axios**: HTTP client with interceptors for token management
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library
- **Moment.js**: Date formatting and manipulation
- **React Hot Toast**: Elegant toast notifications
- **Emoji Picker React**: Icon selection for transactions
- **Lucide React**: Modern icon library

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT**: JSON Web Tokens for authentication
- **Bcrypt**: Password hashing
- **Multer**: File upload middleware
- **SheetJS (xlsx)**: Excel file generation
- **Hugging Face Inference**: AI model integration
- **CORS**: Cross-origin resource sharing
- **Dotenv**: Environment variable management

### DevOps & Tools
- **Docker**: Containerization for MongoDB
- **Docker Compose**: Multi-container orchestration
- **Postman**: API testing and documentation

## Getting Started

### Prerequisites

Before running this application, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Docker** (optional, for containerized MongoDB) - [Download](https://www.docker.com/products/docker-desktop)
- **Git** - [Download](https://git-scm.com/downloads)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/expense-tracker.git
cd expense-tracker
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

### Environment Configuration

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/expenseTracker
# OR for MongoDB Atlas:
# MONGO_URI=

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here_min_32_chars
JWT_EXPIRE=1h

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# Hugging Face API
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

**Getting API Keys:**

- **Hugging Face API Key**: 
  1. Sign up at [huggingface.co](https://huggingface.co/)
  2. Go to Settings → Access Tokens
  3. Create a new token with read permissions

#### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Running the Application

#### Option 1: Using Local MongoDB

1. **Start MongoDB Service**
```bash
# On macOS (using Homebrew)
brew services start mongodb-community

# On Windows (run as administrator)
net start MongoDB

# On Linux
sudo systemctl start mongod
```

2. **Start Backend Server**
```bash
cd backend
npm run dev
# Server will run on http://localhost:8000
```

3. **Start Frontend Development Server**
```bash
cd frontend
npm run dev
# Application will run on http://localhost:3000
```

#### Option 2: Using Docker for MongoDB

1. **Start MongoDB with Docker Compose**
```bash
cd backend
docker-compose up -d
```

This will start MongoDB on port 27017 with the credentials defined in `docker-compose.yml`.

2. **Verify MongoDB is Running**
```bash
docker ps
# You should see the expenseTracker container
```

3. **Start Backend and Frontend** (same as Option 1, steps 2-3)

#### Verify Installation

1. **Backend Health Check**
```bash
curl http://localhost:8000/api/v1/auth/login
# Should return 400 (Bad Request) - means server is running
```

2. **Frontend Access**
- Open browser to `http://localhost:3000`
- You should see the login page

### Default Database Credentials (Docker)

If using Docker Compose:
- **Username**: `expensetracker_admin`
- **Password**: `MySecureDBPassword123!`
- **Database**: `expenseTracker`

**Connection String**:
```
mongodb://expensetracker_admin:MySecureDBPassword123!@localhost:27017/expenseTracker?authSource=admin
```

## Acknowledgments

- [Hugging Face](https://huggingface.co/) for AI model hosting
- [Recharts](https://recharts.org/) for charting components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [MongoDB](https://www.mongodb.com/) for database solution

---
