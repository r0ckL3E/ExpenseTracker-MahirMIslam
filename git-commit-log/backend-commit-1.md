# Backend Architecture Explanation

This document explains how the backend authentication system works, using a coffee shop membership system analogy to make the concepts easier to understand.

## 1. server.js - The Main Coffee Shop Building

```javascript
require("dotenv").config();  // Load the shop's secret config file
const express = require("express");  // Import the coffee shop framework
const cors = require("cors");  // Import the door policy manager
```

**Real Life:** You're setting up a coffee shop. You need the building framework (Express), door policies for customers from different locations (CORS), and your secret business config file (.env).

```javascript
const app = express();  // Create the actual coffee shop
```

**Syntax:** `express()` creates a new web server application. Think of it as constructing your coffee shop building.

```javascript
app.use(cors({
    origin: process.env.CLIENT_URL || "*",  // Allow customers from our website or anywhere
    methods: ["GET", "POST", "PUT", "DELETE"],  // Allow these types of requests
    allowedHeaders: ["Content-Type", "Authorization"],  // Accept these types of tickets
}));
```

**Real Life:** You're telling your door security: "Let customers in from our main website, allow them to browse (GET), order (POST), modify orders (PUT), cancel orders (DELETE), and accept their membership cards (Authorization header)."

```javascript
app.use(express.json());  // Understand customer requests in JSON format
connectDB();  // Connect to our customer database
app.use("/api/v1/auth", authRoutes);  // For /api/v1/auth requests, use the membership desk
```

**Syntax:** 
- `app.use()` adds middleware (like hiring staff)
- `express.json()` parses JSON request bodies
- Routes direct traffic to specific departments

---

## 2. config/db.js - The Database Connection Manager

```javascript
const mongoose = require("mongoose");  // Import the database connector toolkit

const connectDB = async () => {  // Function to connect to our customer database
    try {
        await mongoose.connect(process.env.MONGO_URI, {});  // Attempt connection
        console.log("MongoDB connected");  // Success message
    } catch (err) {
        console.error("Error connecting to MongoDB", err);  // Log the error
        process.exit(1);  // Shut down the entire coffee shop if database fails
    }
};
```

**Real Life:** This is like your IT manager trying to connect to your customer database. If it works, great! If not, the coffee shop shuts down because you can't operate without customer records.

**Syntax:**
- `async/await`: Handle time-consuming operations
- `try/catch`: Handle success and error scenarios
- `process.exit(1)`: Terminates the entire Node.js application

---

## 3. models/User.js - The Customer Profile Template

```javascript
const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },  // Name is mandatory
    email: { type: String, required: true, unique: true },  // Email must be unique
    password: { type: String, required: true },  // Password is required
    profileImageUrl: { type: String, default: null },  // Photo is optional
}, { timestamps: true });  // Auto-add creation/update dates
```

**Real Life:** This is your membership application form template. It defines what information you collect about each customer and the rules (required fields, unique email).

```javascript
UserSchema.pre("save", async function (next) {  // Before saving, do security check
    if (!this.isModified("password")) return next();  // Skip if password unchanged
    this.password = await bcrypt.hash(this.password, 10);  // Scramble the password
    next();  // Continue with saving
});
```

**Real Life:** Before filing a customer's membership card, your security staff scrambles their password so even you can't read it. It's like putting their password in a locked safe.

**Syntax:**
- `.pre("save")`: Middleware that runs before saving to database
- `this`: Refers to the current user document
- `bcrypt.hash()`: Encrypts the password

```javascript
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};
```

**Real Life:** This creates a method to check if a customer's entered password matches their scrambled version on file, like having a key to check the locked safe.

---

## 4. controllers/authController.js - The Membership Desk Staff

### Registration Function:
```javascript
exports.registerUser = async (req, res) => {  // Handle new membership applications
    const { fullName, email, password, profileImageUrl } = req.body;  // Extract application info
```

**Real Life:** Customer walks up and says "I want to become a member" and hands you their application form.

```javascript
    if (!fullName || !email || !password) {  // Check if form is complete
        return res.status(400).json({ message: "All fields are required" });
    }
```

**Real Life:** Staff checks: "Did you fill out name, email, and password? No? Please complete the form."

```javascript
    const existingUser = await User.findOne({ email });  // Check if email already exists
    if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
    }
```

**Real Life:** Staff looks through existing member files: "Sorry, this email is already registered by another customer."

```javascript
    const user = await User.create({ fullName, email, password, profileImageUrl });
    res.status(201).json({
        id: user._id,
        user,
        token: generateToken(user._id),  // Give them a daily access pass
    });
```

**Real Life:** Staff creates membership record and hands customer their membership card plus a daily access wristband.

### Login Function:
```javascript
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;  // Get login credentials
    
    const user = await User.findOne({ email });  // Find customer file
    if (!user || !(await user.comparePassword(password))) {  // Verify password
        return res.status(400).json({ message: "Invalid credentials" });
    }
```

**Real Life:** Customer says "It's me!" Staff finds their file and checks if the password matches. If not: "Sorry, wrong credentials."

---

## 5. middleware/authMiddleware.js - The Security Guard

```javascript
exports.protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(" ")[1];  // Check for access wristband
    if (!token) return res.status(401).json({ message: "Not authorized, no token" });
```

**Real Life:** Security guard checks: "Do you have your daily access wristband? No? You can't enter the VIP area."

```javascript
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Verify wristband is real
    req.user = await User.findById(decoded.id).select('-password');  // Get customer info
    next();  // Allow them to proceed
```

**Real Life:** Guard scans the wristband barcode, confirms it's valid and belongs to this customer, then waves them through.

---

## 6. routes/authRoutes.js - The Department Directory

```javascript
router.post("/register", registerUser);  // Registration desk is at /register
router.post("/login", loginUser);  // Login desk is at /login
router.get("/getUser", protect, getUserInfo);  // VIP info desk - security check required
```

**Real Life:** This is like the directory board in your coffee shop:
- Want to become a member? Go to the registration desk
- Already a member? Go to the login desk  
- Want VIP services? Security will check your wristband first, then direct you to customer service

---

## 7. docker-compose.yml - The Database Building Setup

```yaml
services:
  mongodb:
    image: mongo:latest  # Use the latest MongoDB building design
    container_name: expenseTracker  # Name this building 'expenseTracker'
    ports:
      - "27017:27017"  # Building door 27017 connects to room 27017
    environment:  # Security settings for the building
      MONGO_INITDB_ROOT_USERNAME: expensetracker_admin
      MONGO_INITDB_ROOT_PASSWORD: MySecureDBPassword123!
```

**Real Life:** You're hiring a construction company to build your customer database building. You're specifying the building design (mongo:latest), what to call it, which door to use, and the security credentials for the building manager.

---

## The Complete Flow:

1. **server.js**: Sets up the coffee shop building and staff
2. **db.js**: Connects to the customer database building  
3. **User.js**: Defines the membership card template
4. **authController.js**: Handles customer registration and login at the membership desk
5. **authMiddleware.js**: Security guard checks access wristbands
6. **authRoutes.js**: Directory showing where each service is located
7. **docker-compose.yml**: Builds the database building with proper security

Each piece works together like departments in a well-organized coffee shop!

## Authentication Process Summary:

1. **Customer Registration**: New users provide details → Backend validates → Creates account → Returns JWT token
2. **Customer Login**: Existing users provide credentials → Backend verifies → Returns JWT token
3. **Protected Access**: Users include JWT token in requests → Middleware verifies → Allows access to protected routes

This architecture ensures secure user authentication while maintaining clean, organized code structure.