# Expense Management System - Technical Documentation

This document provides a detailed explanation of the expense management system implementation, covering all components and their interactions.

## System Overview

The expense management system allows users to:
- Add expense records with category, amount, and date
- Retrieve all expense records sorted by date
- Delete specific expense records
- Download expense data as Excel files

---

## 1. Expense Model (models/Expense.js)

```javascript
const mongoose = require("mongoose");
```
**Purpose:** Import Mongoose ODM (Object Document Mapper) to interact with MongoDB database.

```javascript
const ExpenseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    icon: { type: String },
    category: { type: String, required: true }, // Example: Food, Rent, Groceries
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true });
```

**Schema Definition:**
- `new mongoose.Schema()`: Creates a blueprint for expense documents in MongoDB
- Each field definition specifies data type and validation rules

**Field Breakdown:**
- `userId`: 
  - `mongoose.Schema.Types.ObjectId`: MongoDB's unique identifier type (24-character hex string)
  - `ref: "User"`: Creates a relationship to User model (foreign key)
  - `required: true`: Cannot be null or undefined
  - Links each expense to the user who created it
  
- `icon`: 
  - `type: String`: Text data
  - No `required` flag means it's optional
  - Could store icon name (e.g., "food-icon") or emoji
  
- `category`: 
  - `type: String`: Text data
  - `required: true`: Must be provided
  - Examples: "Food", "Rent", "Groceries", "Transportation"
  
- `amount`: 
  - `type: Number`: Numeric data (supports decimals)
  - `required: true`: Must be provided
  - Represents monetary value (e.g., 45.50)
  
- `date`: 
  - `type: Date`: JavaScript Date object
  - `default: Date.now`: If not provided, uses current date/time
  - Stores when the expense occurred

**Options Object:**
- `{ timestamps: true }`: Mongoose automatically adds two fields:
  - `createdAt`: When document was first saved
  - `updatedAt`: When document was last modified

```javascript
module.exports = mongoose.model("Expense", ExpenseSchema);
```
**Export:**
- `mongoose.model("Expense", ExpenseSchema)`: Creates Expense model from schema
- First argument: Model name (used in MongoDB as "expenses" collection)
- Second argument: Schema definition
- `module.exports`: Makes model available for import in other files

---

## 2. Expense Controller (controllers/expenseController.js)

### Dependencies
```javascript
const xlsx = require('xlsx');
const Expense = require("../models/Expense");
```
**Imports:**
- `xlsx`: Third-party library for creating Excel spreadsheets
- `Expense`: The Expense model for database operations
- `../models/Expense`: Relative path (go up one directory, then into models folder)

### Add Expense Function
```javascript
exports.addExpense = async (req, res) => {
```
**Function Declaration:**
- `exports.addExpense`: Attaches function to module exports object
- `async`: Enables use of `await` for asynchronous operations
- `(req, res)`: Express route handler parameters
  - `req`: Request object (contains data from client)
  - `res`: Response object (sends data back to client)

```javascript
    const userId = req.user.id;
```
**User Identification:**
- `req.user`: Set by `protect` middleware after JWT authentication
- `.id`: MongoDB document ID of authenticated user
- Extracted before try/catch to use throughout function

```javascript
  try {
    const { icon, category, amount, date } = req.body;
```
**Destructuring:**
- `req.body`: Contains JSON data sent by client
- `{ icon, category, amount, date }`: Extracts these specific properties
- Equivalent to:
  ```javascript
  const icon = req.body.icon;
  const category = req.body.category;
  const amount = req.body.amount;
  const date = req.body.date;
  ```

```javascript
    // Validation: Check for missing fields
    if (!category || !amount || !date) {
        return res.status(400).json({ message: "All fields are required" });
    }
```
**Input Validation:**
- `!category`: True if category is null, undefined, empty string, 0, or false
- `||`: Logical OR - if ANY condition is true, entire expression is true
- `res.status(400)`: Sets HTTP status code to 400 (Bad Request)
- `.json({ message: ... })`: Sends JSON response to client
- `return`: Exits function immediately (doesn't continue to database save)

```javascript
    const newExpense = new Expense({
        userId,
        icon,
        category,
        amount,
        date: new Date(date)
    });
```
**Document Creation:**
- `new Expense({...})`: Creates new expense document instance (not saved yet)
- `userId`: Shorthand for `userId: userId`
- `new Date(date)`: Converts date string from client to JavaScript Date object
  - Input: "2025-01-15" (string)
  - Output: Date object representing that date

```javascript
    await newExpense.save();
    res.status(200).json(newExpense);
```
**Database Save:**
- `await`: Pauses execution until save completes
- `.save()`: Mongoose method that inserts document into MongoDB
- Triggers schema validation and pre-save hooks
- Returns the saved document with MongoDB-generated `_id`
- `res.status(200)`: HTTP 200 (Success)
- `.json(newExpense)`: Sends saved expense back to client

```javascript
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
```
**Error Handling:**
- Catches any errors from validation, database connection, etc.
- `status(500)`: HTTP 500 (Internal Server Error)
- Generic error message (doesn't expose internal details to client)

### Get All Expenses Function
```javascript
exports.getAllExpense = async(req, res) => {
    const userId = req.user.id;
  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });
    res.json(expense);
```
**Query Explanation:**
- `Expense.find({ userId })`: MongoDB query to find all documents matching criteria
  - `{ userId }`: Filter - only documents where userId field equals this value
  - Returns array of matching documents
- `.sort({ date: -1 })`: Sorts results before returning
  - `{ date: -1 }`: Sort by date field
  - `-1`: Descending order (newest first)
  - `1` would be ascending order (oldest first)
- `await`: Waits for database query to complete
- `res.json(expense)`: Sends array of expense documents to client

**Chaining Methods:**
```javascript
Expense.find({ userId })  // Returns Query object
      .sort({ date: -1 })  // Still Query object, adds sort operation
```
Query doesn't execute until `await` is encountered.

### Delete Expense Function
```javascript
exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: "Expense deleted successfully" });
```
**Delete Operation:**
- `req.params.id`: Extracts ID from URL path
  - URL: `/api/v1/expense/abc123`
  - `req.params.id` = "abc123"
- `findByIdAndDelete()`: Mongoose method that:
  1. Finds document by `_id`
  2. Deletes it from database
  3. Returns the deleted document (or null if not found)
- No verification that expense belongs to authenticated user (security issue)

**Security Gap:**
Any authenticated user could delete any expense by guessing IDs.

**Improved Version:**
```javascript
const expense = await Expense.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.user.id 
});
if (!expense) {
    return res.status(404).json({ message: "Expense not found" });
}
```

### Download Excel Function
```javascript
exports.downloadExpenseExcel = async (req, res) => {
    const userId = req.user.id;
  try {
    const expense = await Expense.find({ userId }).sort({ date: -1 });
```
**Data Retrieval:** Gets all user's expenses in chronological order (newest first).

```javascript
    // Prepare data for Excel
    const data = expense.map((item) => ({
        Source: item.category,
        Amount: item.amount,
        Date: item.date,
    }));
```
**Data Transformation:**
- `.map()`: Array method that transforms each element
- `(item) => ({...})`: Arrow function taking each expense document
- Returns new array of plain objects
- Renames fields for Excel column headers:
  - `item.category` becomes `Source`
  - `item.amount` becomes `Amount`
  - `item.date` becomes `Date`

**Example:**
```javascript
// Input array:
[{ category: "Food", amount: 50, date: "2025-01-15" }]

// Output array:
[{ Source: "Food", Amount: 50, Date: "2025-01-15" }]
```

```javascript
    const wb = xlsx.utils.book_new();
```
**Workbook Creation:**
- `xlsx.utils`: Utility functions from xlsx library
- `.book_new()`: Creates empty Excel workbook
- Workbook can contain multiple worksheets (tabs)

```javascript
    const ws = xlsx.utils.json_to_sheet(data);
```
**Worksheet Creation:**
- `.json_to_sheet(data)`: Converts JSON array to Excel worksheet
- First object's keys become column headers
- Each object becomes a row

```javascript
    xlsx.utils.book_append_sheet(wb, ws, "expense");
```
**Add Worksheet to Workbook:**
- `book_append_sheet()`: Adds worksheet to workbook
- First argument: Workbook to modify
- Second argument: Worksheet to add
- Third argument: Tab name in Excel ("expense")

```javascript
    xlsx.writeFile(wb, 'expense_details.xlsx');
```
**Save to Server Filesystem:**
- `writeFile()`: Writes workbook to file
- First argument: Workbook object
- Second argument: Filename (saves in current directory)
- Creates physical file on server

```javascript
    res.download('expense_details.xlsx');
```
**Send File to Client:**
- `res.download()`: Express method that:
  1. Sets appropriate headers for file download
  2. Sends file contents to client
  3. Triggers browser's "Save File" dialog
- File remains on server after download (cleanup issue)

**Cleanup Issue:**
Files accumulate on server. Better approach:
```javascript
const filePath = path.join(__dirname, 'expense_details.xlsx');
xlsx.writeFile(wb, filePath);
res.download(filePath, () => {
    fs.unlinkSync(filePath);  // Delete after sending
});
```

---

## 3. Expense Routes (routes/expenseRoutes.js)

```javascript
const express = require("express");
```
**Import Express:** Needed to create router instance.

```javascript
const {
    addExpense,
    getAllExpense,
    deleteExpense,
    downloadExpenseExcel
} = require("../controllers/expenseController");
```
**Import Controllers:**
- Destructuring to extract specific functions from exports object
- Each function handles one route's logic

```javascript
const { protect } = require("../middleware/authMiddleware");
```
**Import Middleware:** `protect` function verifies JWT tokens.

```javascript
const router = express.Router();
```
**Create Router:**
- `express.Router()`: Creates modular route handler
- Allows defining routes separately from main server
- Can be mounted at specific path in main app

```javascript
router.post("/add", protect, addExpense);
```
**Route Definition:**
- `router.post()`: Handles POST requests
- `"/add"`: URL path (relative to where router is mounted)
- `protect`: Middleware executed first (authentication)
- `addExpense`: Controller function executed if middleware passes

**Full URL:** `http://localhost:8000/api/v1/expense/add`
- `/api/v1/expense` from server.js mounting
- `/add` from this route definition

**Request Flow:**
1. Client sends POST to `/api/v1/expense/add`
2. Express routes to expense router
3. `protect` middleware runs first
4. If authenticated, `addExpense` controller runs
5. Controller sends response

```javascript
router.get("/get", protect, getAllExpense);
router.get("/downloadexcel", protect, downloadExpenseExcel);
```
**GET Routes:**
- `.get()`: Handles GET requests (retrieving data)
- Same middleware pattern (protect first, then controller)

```javascript
router.delete("/:id", protect, deleteExpense);
```
**Dynamic Route Parameter:**
- `/:id`: Colon indicates variable segment
- `id` is parameter name, accessible via `req.params.id`
- Matches any value in that position
- Examples:
  - `/api/v1/expense/abc123` → `req.params.id = "abc123"`
  - `/api/v1/expense/xyz789` → `req.params.id = "xyz789"`

```javascript
module.exports = router;
```
**Export Router:** Makes router available for import in server.js.

---

## 4. Server Configuration (server.js)

### Imports
```javascript
require("dotenv").config();
```
**Environment Variables:**
- Loads variables from `.env` file
- Makes them available via `process.env.VARIABLE_NAME`
- Must be first line to ensure variables load before other imports

```javascript
const express = require("express");
const cors = require("cors");
const path = require("path");
```
**Core Dependencies:**
- `express`: Web framework
- `cors`: Cross-Origin Resource Sharing middleware
- `path`: Node.js module for file path operations

```javascript
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
```
**Application Modules:**
- `connectDB`: Database connection function
- Route modules: Collections of related routes

### Application Setup
```javascript
const app = express();
```
**Create Express App:** Initializes new Express application instance.

### CORS Configuration
```javascript
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
```
**CORS Middleware:**
- `app.use()`: Registers middleware to run on all requests
- `cors({...})`: Configures Cross-Origin Resource Sharing

**Options:**
- `origin`: Which domains can make requests
  - `process.env.CLIENT_URL`: Specific domain from .env (e.g., "http://localhost:3000")
  - `"*"`: Fallback allowing all domains (development only)
- `methods`: HTTP methods allowed from cross-origin requests
- `allowedHeaders`: Headers client can send

**Why CORS is Needed:**
Browser security prevents frontend (localhost:3000) from calling backend (localhost:8000) without permission.

### JSON Parser
```javascript
app.use(express.json());
```
**Body Parser Middleware:**
- Parses incoming request bodies containing JSON
- Makes data available in `req.body`
- Without this, `req.body` would be undefined

### Database Connection
```javascript
connectDB();
```
**Initiate MongoDB Connection:**
- Calls async function that connects to MongoDB
- Connection happens asynchronously (doesn't block server startup)
- Errors handled within connectDB function

### Route Mounting
```javascript
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/income", incomeRoutes);
app.use("/api/v1/expense", expenseRoutes);
```
**Mount Routers:**
- First argument: Base path prefix
- Second argument: Router to use for that prefix
- All routes in router are relative to base path

**Example:**
```javascript
// In expenseRoutes: router.post("/add", ...)
// Mounted at: "/api/v1/expense"
// Full URL: "/api/v1/expense/add"
```

### Static File Serving
```javascript
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```
**Serve Static Files:**
- `"/uploads"`: URL path prefix
- `express.static()`: Middleware to serve files
- `path.join(__dirname, "uploads")`: Absolute path to uploads folder
  - `__dirname`: Current directory (where server.js is located)
  - `"uploads"`: Folder name
  - Result: `/Users/user/project/backend/uploads`

**Effect:**
Files in `backend/uploads/` folder accessible via HTTP:
- File: `backend/uploads/image.jpg`
- URL: `http://localhost:8000/uploads/image.jpg`

### Server Startup
```javascript
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```
**Start HTTP Server:**
- `process.env.PORT`: Port from .env file
- `|| 5000`: Fallback if PORT not defined
- `app.listen()`: Starts server listening on specified port
- Callback function runs after server starts
- Template literal: `` `Server running on port ${PORT}` ``
  - `${PORT}` interpolates variable value

---

## Complete Request Flow Example

### Adding an Expense:

**1. Client Request:**
```
POST http://localhost:8000/api/v1/expense/add
Headers: {
  Authorization: "Bearer eyJhbGc...",
  Content-Type: "application/json"
}
Body: {
  "category": "Food",
  "amount": 45.50,
  "date": "2025-01-15",
  "icon": "🍕"
}
```

**2. Server Processing:**
```
Express receives request
  ↓
CORS middleware checks origin
  ↓
express.json() parses body
  ↓
Routes to /api/v1/expense router
  ↓
protect middleware validates JWT
  ↓
Sets req.user from token
  ↓
addExpense controller executes
  ↓
Validates required fields
  ↓
Creates Expense document
  ↓
Saves to MongoDB
  ↓
Returns saved expense as JSON
```

**3. Server Response:**
```json
{
  "_id": "65abc123...",
  "userId": "65def456...",
  "category": "Food",
  "amount": 45.50,
  "date": "2025-01-15T00:00:00.000Z",
  "icon": "🍕",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

---

## Security Considerations

**Implemented Security:**
- JWT authentication on all expense routes
- User-specific data isolation (expenses filtered by userId)
- Input validation for required fields
- CORS configuration to control access

**Security Gaps:**
- Delete function doesn't verify ownership (any user can delete any expense)
- No rate limiting on API endpoints
- Excel files saved to filesystem without cleanup
- No input sanitization (potential for NoSQL injection)
- No maximum limits on data retrieval (could fetch thousands of records)

**Recommended Improvements:**
```javascript
// Verify ownership before deletion
exports.deleteExpense = async (req, res) => {
  const expense = await Expense.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.user.id 
  });
  if (!expense) {
    return res.status(404).json({ message: "Not found or unauthorized" });
  }
  res.json({ message: "Deleted successfully" });
};

// Add pagination to prevent large data transfers
exports.getAllExpense = async(req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  const expenses = await Expense.find({ userId: req.user.id })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
  res.json(expenses);
};
```

This system provides complete CRUD operations for expense management with Excel export capability, integrated with JWT authentication for security.