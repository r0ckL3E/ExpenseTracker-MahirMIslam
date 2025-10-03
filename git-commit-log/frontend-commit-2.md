# Frontend-Backend Integration Documentation

This document explains how the React frontend connects to the Express backend, with detailed explanations of each file and how they interact.

---

## System Architecture Overview

```
React Frontend (localhost:3000)
       ↓
  axios HTTP requests
       ↓
Express Backend (localhost:8000)
       ↓
  MongoDB Database
```

---

## 1. Configuration Files

### apiPaths.js - API Endpoint Definitions

```javascript
export const BASE_URL = "http://localhost:8000";
```
**Base URL Definition:**
- Central configuration for backend server location
- Used by axiosInstance for all API calls
- Change this for different environments (development/production)

```javascript
export const API_PATHS = {
    AUTH: {
        LOGIN: "/api/v1/auth/login",
        REGISTER: "/api/v1/auth/register",
        GET_USER_INFO: "/api/v1/auth/getUser",
    },
```
**Authentication Endpoints:**
- Object structure organizes related endpoints
- These paths correspond to backend routes in `backend/routes/authRoutes.js`

**Backend Connection:**
```javascript
// Backend: routes/authRoutes.js
router.post("/login", loginUser);        // → /api/v1/auth/login
router.post("/register", registerUser);  // → /api/v1/auth/register
router.get("/getUser", protect, getUserInfo); // → /api/v1/auth/getUser
```

```javascript
    DASHBOARD: {
        GET_DATA: "/api/v1/dashboard",
    },
```
**Dashboard Endpoint:**
- Connects to `backend/routes/dashboardRoutes.js`
- Backend: `router.get("/", protect, getDashboardData);`

```javascript
    INCOME: {
        ADD_INCOME: "/api/v1/income/add",
        GET_ALL_INCOME: "api/v1/income/get",  // ⚠️ Missing leading slash
        DELETE_INCOME: (incomeId) => `/api/v1/income/${incomeId}`,
        DOWNLOAD_INCOME: `/api/v1/income/downloadexcel`,
    },
```
**Income Endpoints:**
- `DELETE_INCOME` is a **function** that takes incomeId parameter
- Returns dynamic URL with ID embedded
- Example: `DELETE_INCOME("abc123")` → `"/api/v1/income/abc123"`

**Bug Alert:** `GET_ALL_INCOME` missing `/` at start - should be `"/api/v1/income/get"`

**Backend Connection:**
```javascript
// Backend: routes/incomeRoutes.js
router.post("/add", protect, addIncome);           // → /api/v1/income/add
router.get("/get", protect, getAllIncome);         // → /api/v1/income/get
router.delete("/:id", protect, deleteIncome);      // → /api/v1/income/:id
router.get("/downloadexcel", protect, downloadIncomeExcel);
```

```javascript
    IMAGE: {
        UPLOAD_IMAGE: "/api/v1/auth/upload-image",
    },
```
**Image Upload:**
- Connects to route in `backend/routes/authRoutes.js`
- Backend: `router.post("/upload-image", upload.single("image"), ...);`

---

## 2. HTTP Client Configuration

### axiosInstance.js - Configured Axios Client

```javascript
import axios from "axios";
import { BASE_URL } from "./apiPaths";
```
**Imports:**
- `axios`: HTTP client library for making API requests
- `BASE_URL`: Backend server URL

```javascript
const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});
```
**Create Configured Instance:**
- `axios.create()`: Creates custom axios instance with defaults
- `baseURL`: Prepended to all request URLs
  - Request to `/api/v1/auth/login` → `http://localhost:8000/api/v1/auth/login`
- `timeout: 10000`: Cancel request after 10 seconds (10,000ms)
- `headers`: Default headers sent with every request
  - `Content-Type`: Tells server we're sending JSON
  - `Accept`: Tells server we expect JSON response

### Request Interceptor

```javascript
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
```

**Request Interceptor Purpose:**
- Runs before every HTTP request
- Automatically adds authentication token to requests

**Flow:**
1. Function receives `config` object (request configuration)
2. `localStorage.getItem("token")`: Retrieves JWT from browser storage
3. If token exists, adds to request headers: `Authorization: Bearer eyJhbGc...`
4. Returns modified config
5. Request proceeds with token attached

**Backend Connection:**
This token is validated by `backend/middleware/authMiddleware.js`:
```javascript
exports.protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1];
    // Validates token and sets req.user
};
```

**Without Interceptor:**
```javascript
// Would need to manually add token to every request:
axios.post('/api/v1/income/add', data, {
    headers: { Authorization: `Bearer ${token}` }
});
```

**With Interceptor:**
```javascript
// Token automatically added:
axiosInstance.post('/api/v1/income/add', data);
```

### Response Interceptor

```javascript
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
```
**Success Handler:**
- Receives successful responses (status 200-299)
- Returns response unchanged (could transform data here if needed)

```javascript
    (error) => {
        if (error.response) {
            if (error.response.status === 401) {
                window.location.href = "/login";
            } else if (error.response.status === 500) {
                console.error("Server error. Please try again later.");
            }
        } else if (error.code === "ECONNABORTED") {
            console.error("Request timeout. Please try again.");
        }
        return Promise.reject(error);
    }
);
```

**Error Handler:**
- Intercepts all failed responses
- `error.response`: Exists if server responded with error status

**Status Code Handling:**
- `401 Unauthorized`: Token invalid/expired
  - Automatically redirects to login page
  - Backend sends 401 when `protect` middleware fails
- `500 Internal Server Error`: Backend crashed
  - Logs error message
  - Backend sends 500 from try/catch blocks
- `ECONNABORTED`: Request timeout (> 10 seconds)

**Backend Connection:**
Backend controllers return these status codes:
```javascript
// Backend: authController.js
if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
}
// Frontend interceptor catches 401 and redirects to login
```

---

## 3. Context Management

### UserContext.jsx - Global User State

```javascript
import React, { createContext, useState } from "react";

export const UserContext = createContext();
```
**Context Creation:**
- `createContext()`: Creates React Context object
- Allows sharing data across component tree without prop drilling
- Export allows other components to import and use context

```javascript
const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
```
**Provider Component:**
- `{ children }`: Destructures children prop (components wrapped by provider)
- `useState(null)`: Creates state variable for user data
  - Initial value: `null` (no user logged in)
  - `setUser`: Function to update user state

```javascript
    const updateUser = (userData) => {
        setUser(userData);
    };

    const clearUser = () => {
        setUser(null);
    };
```
**Helper Functions:**
- `updateUser`: Updates user state with data from login/register
- `clearUser`: Resets user to null (for logout)
- These functions will be available to all child components

```javascript
    return (
        <UserContext.Provider
        value={{
            user,
            updateUser,
            clearUser,
        }}
        >
            {children}
        </UserContext.Provider>
    )
}
```
**Provider Component Return:**
- `UserContext.Provider`: Makes context available to children
- `value`: Object with data/functions to share
- `{children}`: Renders child components inside provider
- Any component inside provider can access user, updateUser, clearUser

**Usage Pattern:**
```javascript
// In App.jsx:
<UserProvider>
  <Login />  {/* Can access user context */}
  <Dashboard />  {/* Can access user context */}
</UserProvider>
```

---

## 4. Authentication Pages

### Login.jsx - User Login Component

```javascript
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';
```
**Context Import:**
- `useContext`: React hook to access context values
- `UserContext`: The context created in UserContext.jsx

```javascript
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const { updateUser } = useContext(UserContext);
  const navigate = useNavigate();
```
**Component State:**
- `email`, `password`: Form input values
- `error`: Error message to display
- `updateUser`: Function from UserContext to store user data
- `navigate`: React Router function to programmatically navigate

```javascript
  const handleLogin = async (e) => {
    e.preventDefault();
```
**Form Submit Handler:**
- `e.preventDefault()`: Stops default form submission (page reload)
- `async`: Enables await for API calls

```javascript
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");
```
**Client-Side Validation:**
- Checks email format using helper function
- Checks password exists
- Clears any previous errors before API call
- Prevents unnecessary API calls with invalid data

```javascript
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });
```
**API Call:**
- `axiosInstance.post()`: Makes POST request
- First argument: URL path (`"/api/v1/auth/login"`)
- Second argument: Request body (data to send)
- `await`: Waits for response before continuing

**Backend Connection:**
This calls `backend/controllers/authController.js`:
```javascript
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;  // Receives this data
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    res.status(200).json({
        id: user._id,
        user,
        token: generateToken(user._id)
    });
};
```

```javascript
      const { token, user } = response.data;
```
**Response Destructuring:**
- `response.data`: Contains backend's JSON response
- Extracts `token` and `user` from response
- Backend sends: `{ id, user, token }`

```javascript
      if (token) {
        localStorage.setItem("token", token);
        updateUser(user);
        navigate("/dashboard");
      }
```
**Successful Login:**
- `localStorage.setItem("token", token)`: Saves JWT to browser
  - Persists across page refreshes
  - Retrieved by axios interceptor for future requests
- `updateUser(user)`: Stores user data in context
- `navigate("/dashboard")`: Redirects to dashboard page

```javascript
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
```
**Error Handling:**
- `error.response`: Exists if backend sent error response
- `error.response.data.message`: Backend's error message
- Displays specific error from backend or generic message
- Backend might send: `{ message: "Invalid credentials" }`

### SignUp.jsx - User Registration Component

```javascript
const handleSignUp = async (e) => {
    e.preventDefault();

    let profileImageUrl = "";
```
**Initialize Variable:**
- `let`: Variable that will be updated if image uploaded
- Empty string as default (no image)

```javascript
    // Validation checks...
    
    try {
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      }
```
**Image Upload:**
- Checks if user selected profile picture
- `uploadImage(profilePic)`: Calls upload utility function
- `await`: Waits for upload to complete before registration
- Updates `profileImageUrl` with URL from backend

**Backend Connection:**
Calls `backend/routes/authRoutes.js`:
```javascript
router.post("/upload-image", upload.single("image"), (req, res) => {
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.status(200).json({ imageUrl });
});
```

```javascript
      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullName,
        email,
        password,
        profileImageUrl
      });
```
**Registration API Call:**
- Sends user data including uploaded image URL
- Backend saves all data to MongoDB

**Backend Connection:**
Calls `backend/controllers/authController.js`:
```javascript
exports.registerUser = async (req, res) => {
    const { fullName, email, password, profileImageUrl } = req.body;
    const user = await User.create({
        fullName,
        email,
        password,  // Hashed by User model pre-save hook
        profileImageUrl,
    });
    res.status(201).json({
        id: user._id,
        user,
        token: generateToken(user._id),
    });
};
```

---

## 5. Utility Functions

### uploadImage.js - Image Upload Handler

```javascript
const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
```
**FormData Creation:**
- `new FormData()`: Creates multipart form data object
- `.append('image', imageFile)`: Adds file with field name "image"
- Field name must match backend: `upload.single("image")`

**Why FormData:**
- JSON can't transmit files
- FormData handles binary file data
- Browser automatically sets `Content-Type: multipart/form-data`

```javascript
    try {
        const response = await axiosInstance.post(
            API_PATHS.IMAGE.UPLOAD_IMAGE, 
            formData, 
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return response.data;
```
**Upload Request:**
- Third argument: Config object with custom headers
- Overrides default `application/json` from axiosInstance
- Returns backend response containing image URL

**Backend Connection:**
Backend uses Multer middleware to process file:
```javascript
// backend/middleware/uploadMiddleware.js
const upload = multer({ 
    storage: multer.diskStorage({
        destination: 'uploads/',
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}-${file.originalname}`);
        }
    })
});

// backend/routes/authRoutes.js
router.post("/upload-image", upload.single("image"), (req, res) => {
    // req.file contains uploaded file info
    res.json({ imageUrl: `http://localhost:8000/uploads/${req.file.filename}` });
});
```

---

## 6. Application Setup

### App.jsx - Main Application Component

```javascript
import UserProvider from './context/UserContext';

const App = () => {
  return (
    <UserProvider>
      <div>
        <Router>
          <Routes>
```
**Context Provider Wrapping:**
- `<UserProvider>` wraps entire app
- Makes user context available to all routes
- All components can access user state

```javascript
const Root = () => {
  const isAuthenticated = localStorage.getItem("token");
  
  return isAuthenticated ? (
    <Navigate to="/dashboard" />
  ) : (
    <Navigate to="/login" />
  );
};
```
**Root Route Guard:**
- Checks localStorage for token
- If token exists: User logged in → redirect to dashboard
- If no token: User not logged in → redirect to login
- Runs on every visit to "/"

**Authentication Flow:**
```
User visits "/" 
  ↓
Check localStorage for token
  ↓
Token exists? → Yes → Dashboard
  ↓
Token exists? → No → Login page
```

---

## Complete Request Flow Example: User Login

### Frontend Flow:

```javascript
// 1. User submits login form
handleLogin() called
  ↓
// 2. Validate email and password
if (!validateEmail(email)) return;
  ↓
// 3. Make API request
const response = await axiosInstance.post('/api/v1/auth/login', {
    email: "user@example.com",
    password: "password123"
});
  ↓
// 4. Request interceptor adds token (if exists)
config.headers.Authorization = `Bearer ${token}`;
  ↓
// 5. HTTP Request sent
POST http://localhost:8000/api/v1/auth/login
Headers: { Content-Type: "application/json" }
Body: { "email": "user@example.com", "password": "password123" }
```

### Backend Flow:

```javascript
// 1. Express receives request
app.use("/api/v1/auth", authRoutes);
  ↓
// 2. Routes to login handler
router.post("/login", loginUser);
  ↓
// 3. Controller processes request
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    const isValid = await user.comparePassword(password);
    const token = generateToken(user._id);
    res.json({ id: user._id, user, token });
};
  ↓
// 4. Response sent back
Status: 200
Body: {
    "id": "65abc123",
    "user": { "fullName": "John", "email": "user@example.com", ... },
    "token": "eyJhbGc..."
}
```

### Frontend Response Handling:

```javascript
// 5. Response interceptor (success - no action)
return response;
  ↓
// 6. Login component receives response
const { token, user } = response.data;
  ↓
// 7. Store token and user
localStorage.setItem("token", token);  // For future requests
updateUser(user);  // For global state access
  ↓
// 8. Navigate to dashboard
navigate("/dashboard");
```

---

## Data Flow Diagrams

### Authentication Token Flow:

```
Registration/Login
    ↓
Backend generates JWT
    ↓
Frontend receives token
    ↓
localStorage.setItem("token", token)
    ↓
axios request interceptor
    ↓
Adds: Authorization: Bearer {token}
    ↓
Backend authMiddleware
    ↓
jwt.verify(token)
    ↓
Sets req.user
    ↓
Protected route accessed
```

### User Context Flow:

```
App.jsx wraps with <UserProvider>
    ↓
Login successful
    ↓
updateUser(userData) called
    ↓
UserContext state updated
    ↓
All components can access user via useContext(UserContext)
    ↓
Display user.fullName, user.email, etc.
```

---

## Security Considerations

### Frontend Security:

**Token Storage:**
- Stored in localStorage (persistent)
- Alternative: sessionStorage (cleared on tab close)
- Vulnerable to XSS attacks
- **Better:** HttpOnly cookies (not accessible by JavaScript)

**Validation:**
- Client-side validation prevents bad requests
- **Not security**: Backend must also validate
- Frontend validation is for UX, not security

### Backend Integration Security:

**CORS Configuration:**
```javascript
// Backend: server.js
app.use(cors({
    origin: "http://localhost:3000",  // Only allow frontend
    credentials: true  // Allow cookies
}));
```

**Request Validation:**
```javascript
// Backend validates every request
if (!email || !password) {
    return res.status(400).json({ message: "All fields required" });
}
```

**Password Hashing:**
```javascript
// Backend: models/User.js
UserSchema.pre("save", async function (next) {
    this.password = await bcrypt.hash(this.password, 10);
});
// Frontend never sees or handles plain passwords
```

---

## Error Handling Patterns

### Frontend Error Display:

```javascript
try {
    const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, data);
    // Success
} catch (error) {
    if (error.response?.data?.message) {
        setError(error.response.data.message);  // Backend error
    } else {
        setError("Something went wrong");  // Network/unknown error
    }
}
```

### Backend Error Responses:

```javascript
// Validation error
return res.status(400).json({ message: "Email already in use" });

// Authentication error
return res.status(401).json({ message: "Invalid credentials" });

// Server error
return res.status(500).json({ message: "Server Error" });
```

### Global Error Handling:

```javascript
// axiosInstance response interceptor catches all errors
if (error.response.status === 401) {
    window.location.href = "/login";  // Auto-logout
}
```

---

## Best Practices Implemented

1. **Centralized API Configuration**: All endpoints in `apiPaths.js`
2. **Axios Instance**: Consistent headers and base URL
3. **Request Interceptors**: Automatic token attachment
4. **Response Interceptors**: Global error handling
5. **Context API**: Shared user state without prop drilling
6. **Client-Side Validation**: Better UX, faster feedback
7. **Error Display**: User-friendly error messages
8. **Protected Routes**: Authentication checks before access

This frontend-backend integration creates a secure, maintainable authentication system with proper separation of concerns and error handling.