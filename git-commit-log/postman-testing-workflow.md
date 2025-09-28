# Postman API Testing Workflow

This document outlines the complete testing workflow for the Expense Tracker authentication system using Postman.

## Collection Setup

**Collection Name:** Expense Tracker  
**Requests:**
- POST Register
- POST Login  
- GET Get User Info
- POST Upload Image

## Testing Workflow

### 1. User Registration

**Endpoint:** `POST {{baseUrl}}/api/v1/auth/register`

**Request Body:**
```json
{
    "fullName": "Mahir Islam", 
    "email": "mahir@timetoprogram.com", 
    "password": "test@321", 
    "profileImageUrl": ""
}
```

**Expected Response:** `201 Created`
```json
{
    "id": "68d856cbe1bacb61587f0b5d",
    "user": {
        "fullName": "Mahir Islam",
        "email": "mahir@timetoprogram.com",
        "password": "$2b$10$RoM6i.JuiYXL4IjF8brbWuQdXgGy9l9H.WrzelIh9EpsGipl5nkWC",
        "profileImageUrl": "",
        "_id": "68d856cbe1bacb61587f0b5d",
        "createdAt": "2025-09-27T21:27:39.347Z",
        "updatedAt": "2025-09-27T21:27:39.347Z",
        "__v": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What Happens:**
1. Backend validates required fields (fullName, email, password)
2. Checks if email already exists in database
3. Creates new user with hashed password (bcrypt)
4. Generates JWT token for immediate authentication
5. Returns user data and token

**Security Note:** The hashed password is currently being returned in the response - this should be removed in production.

---

### 2. User Login

**Endpoint:** `POST {{baseUrl}}/api/v1/auth/login`

**Request Body:**
```json
{
    "email": "mahir@timetoprogram.com", 
    "password": "test@321"
}
```

**Expected Response:** `200 OK`
```json
{
    "id": "68d856cbe1bacb61587f0b5d",
    "user": {
        "_id": "68d856cbe1bacb61587f0b5d",
        "fullName": "Mahir Islam",
        "email": "mahir@timetoprogram.com",
        "password": "$2b$10$RoM6i.JuiYXL4IjF8brbWuQdXgGy9l9H.WrzelIh9EpsGipl5nkWC",
        "profileImageUrl": "",
        "createdAt": "2025-09-27T21:27:39.347Z",
        "updatedAt": "2025-09-27T21:27:39.347Z",
        "__v": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**What Happens:**
1. Backend finds user by email
2. Compares provided password with stored hash using bcrypt
3. If valid, generates new JWT token
4. Returns user data and fresh token

**Important:** Save the token from login response for protected routes.

---

### 3. Get User Info (Protected Route)

**Endpoint:** `GET {{baseUrl}}/api/v1/auth/getUser`

**Authentication:** Bearer Token
- **Type:** Bearer Token
- **Token:** `{{accessToken}}` (from login/register response)

**Expected Response:** `200 OK`
```json
{
    "_id": "68d856cbe1bacb61587f0b5d",
    "fullName": "Mahir Islam",
    "email": "mahir@timetoprogram.com",
    "profileImageUrl": "",
    "createdAt": "2025-09-27T21:27:39.347Z",
    "updatedAt": "2025-09-27T21:27:39.347Z",
    "__v": 0
}
```

**What Happens:**
1. `authMiddleware.protect` extracts Bearer token from headers
2. Verifies JWT token signature and expiration
3. Finds user in database using decoded user ID
4. Returns clean user data (password excluded)

**Security Feature:** Notice the password field is NOT included in this response.

---

### 4. Upload Image

**Endpoint:** `POST {{baseUrl}}/api/v1/upload/image`

**Request Type:** `multipart/form-data`
- **Key:** `image` (File type)
- **Value:** Upload image file (e.g., `6fdytiehhhu51.jpg`)

**Expected Response:** `200 OK`
```json
{
    "imageUrl": "http://localhost:8000/uploads/1759008575376-6fdytiehhhu51.jpg"
}
```

**What Happens:**
1. Multer middleware processes the multipart form data
2. `fileFilter` validates file type (jpeg, jpg, png only)
3. File saved to `uploads/` directory with timestamp prefix
4. Returns accessible URL for the uploaded image

**File Storage:** Images stored in `backend/uploads/` directory.

---

## Testing Sequence

### Complete Authentication Flow:

1. **Register** → Get token → Save for later use
2. **Login** → Get fresh token → Update saved token  
3. **Get User Info** → Use saved token → Verify protected route works
4. **Upload Image** → Test file upload functionality

### Error Testing Scenarios:

**Registration Errors:**
- Missing fields → `400 "All fields are required"`
- Duplicate email → `400 "Email already in use"`
- Invalid email format → `400 "Please enter a valid email"`

**Login Errors:**  
- Wrong password → `400 "Invalid credentials"`
- Non-existent email → `400 "Invalid credentials"`
- Missing fields → `400 "All fields are required"`

**Protected Route Errors:**
- No token → `401 "Not authorized, no token"`  
- Invalid token → `401 "Not authorized, token failed"`
- Expired token → `401 "Not authorized, token failed"`

**Upload Errors:**
- Wrong file type → `400 "Only .jpeg, .jpg and .png formats are allowed"`
- No file selected → Multer error

---

## Postman Environment Variables

Set up these variables in your Postman environment:

```
baseUrl: http://localhost:8000
accessToken: {{token_from_login_response}}
```

**Pro Tip:** Use Postman's Test scripts to automatically save the token:

```javascript
// In Register/Login request Tests tab:
if (pm.response.code === 200 || pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("accessToken", response.token);
}
```

This automatically updates your `{{accessToken}}` variable for protected routes.

---

## Security Observations

**Current Issues to Address:**
1. **Password in response:** Registration and login return hashed passwords
2. **Token expiration:** Tokens expire in 1 hour (configurable in JWT generation)
3. **HTTPS:** Should use HTTPS in production
4. **Rate limiting:** Consider adding rate limiting for auth endpoints

**Working Security Features:**
1. **Password hashing:** bcrypt with salt rounds
2. **JWT authentication:** Stateless token-based auth
3. **File type validation:** Only image files accepted
4. **Protected routes:** Middleware properly validates tokens