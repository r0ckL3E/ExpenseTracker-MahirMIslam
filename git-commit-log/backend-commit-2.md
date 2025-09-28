# Income Management System - Technical Documentation

This document provides a detailed explanation of the income management system implementation, covering all components and their interactions.

## System Overview

The income management system allows users to:
- Add income records with source, amount, and date
- Retrieve all income records sorted by date
- Delete specific income records
- Download income data as Excel files
- Upload profile images

---

## 1. Income Model (models/Income.js)

```javascript
const mongoose = require("mongoose");
```
**Purpose:** Import Mongoose ODM (Object Document Mapper) for MongoDB interactions.

```javascript
const IncomeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required:true },
    icon: { type: String },
    source: { type: String, required: true }, // Example: Salary, Freelance, etc.
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true });
```

**Field Breakdown:**
- `userId`: References the User who owns this income record
  - `mongoose.Schema.Types.ObjectId`: MongoDB's unique identifier type
  - `ref: "User"`: Establishes relationship with User model (foreign key)
  - `required: true`: This field cannot be empty
- `icon`: Optional string for UI display (could store icon name or URL)
- `source`: Required string describing income source (e.g., "Salary", "Freelance")
- `amount`: Required number representing monetary value
- `date`: Date of income, defaults to current date/time if not provided
- `{ timestamps: true }`: Automatically adds `createdAt` and `updatedAt` fields

```javascript
module.exports = mongoose.model("Income", IncomeSchema);
```
**Purpose:** Creates and exports the Income model, making it available for import in other files.

---

## 2. Income Controller (controllers/incomeController.js)

### Dependencies
```javascript
const xlsx = require('xlsx');
const Income = require("../models/Income");
```
- `xlsx`: Library for creating and manipulating Excel files
- `Income`: Imports the Income model for database operations

### Add Income Function
```javascript
exports.addIncome = async (req, res) => {
    const userId = req.user.id;
```
**Purpose:** Extract user ID from authenticated request (set by auth middleware).

```javascript
  try {
    const { icon, source, amount, date } = req.body;
```
**Destructuring:** Extracts fields from request body into individual variables.

```javascript
    // Validation: Check for missing fields
    if (!source || !amount || !date) {
        return res.status(400).json({ message: "All fields are required" });
    }
```
**Validation:** Ensures required fields are present before processing.

```javascript
    const newIncome = new Income({
        userId,
        icon,
        source,
        amount,
        date: new Date(date)
    });
```
**Object Creation:** Creates new Income document with provided data.
- `new Date(date)`: Converts date string to JavaScript Date object

```javascript
    await newIncome.save();
    res.status(200).json(newIncome);
```
**Database Save:** Persists the new income record and returns it to client.

### Get All Income Function
```javascript
exports.getAllIncome = async(req, res) => {
    const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });
    res.json(income);
```
**Query Explanation:**
- `Income.find({ userId })`: Find all income records for this user
- `.sort({ date: -1 })`: Sort by date in descending order (-1 = newest first)
- Returns array of income documents

### Delete Income Function
```javascript
exports.deleteIncome = async (req, res) => {
  try {
    await Income.findByIdAndDelete(req.params.id);
    res.json({ message: "Income deleted successfully" });
```
**Deletion Process:**
- `req.params.id`: Extracts ID from URL parameter (e.g., `/income/123` → id = "123")
- `findByIdAndDelete()`: MongoDB method to find and remove document by ID

**Security Issue:** This function doesn't verify the income belongs to the authenticated user.

### Download Excel Function
```javascript
exports.downloadIncomeExcel = async (req, res) => {
    const userId = req.user.id;
  try {
    const income = await Income.find({ userId }).sort({ date: -1 });
```
**Data Retrieval:** Gets all user's income records sorted by date.

```javascript
    // Prepare data for Excel
    const data = income.map((item) => ({
        Source: item.source,
        Amount: item.amount,
        Date: item.date,
    }));
```
**Data Transformation:** Converts MongoDB documents to plain objects with Excel-friendly column names.

```javascript
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Income");
```
**Excel Creation:**
- `book_new()`: Creates new Excel workbook
- `json_to_sheet(data)`: Converts JSON data to Excel worksheet
- `book_append_sheet()`: Adds worksheet to workbook with name "Income"

```javascript
    xlsx.writeFile(wb, 'income_details.xlsx');
    res.download('income_details.xlsx');
```
**File Operations:**
- `writeFile()`: Saves Excel file to server filesystem
- `res.download()`: Sends file to client for download

---

## 3. Upload Middleware (middleware/uploadMiddleware.js)

```javascript
const multer = require('multer');
```
**Purpose:** Import Multer for handling file uploads in multipart forms.

### Storage Configuration
```javascript
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
```
**Storage Setup:**
- `multer.diskStorage()`: Stores files on server's file system
- `destination`: Callback function specifying where files are saved
- `filename`: Callback function generating unique filenames
  - `Date.now()`: Current timestamp in milliseconds
  - `file.originalname`: Original filename from client
  - Result: "1759008575376-profile.jpg"

### File Filter
```javascript
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only .jpeg, .jpg and .png formats are allowed'), false);
    }
};
```
**Security Filter:**
- `file.mimetype`: MIME type of uploaded file (e.g., "image/jpeg")
- `allowedTypes.includes()`: Checks if file type is in allowed list
- `cb(null, true)`: Accept the file
- `cb(new Error(), false)`: Reject the file with error message

```javascript
const upload = multer({ storage, fileFilter});
module.exports = upload;
```
**Export Configuration:** Creates multer instance with storage and filter settings.

---

## 4. Income Routes (routes/incomeRoutes.js)

```javascript
const express = require("express");
const {
    addIncome,
    getAllIncome,
    deleteIncome,
    downloadIncomeExcel
} = require("../controllers/incomeController");
const { protect } = require("../middleware/authMiddleware");
```
**Imports:** Express router, controller functions, and authentication middleware.

```javascript
const router = express.Router();
```
**Router Creation:** Creates modular router instance for income-related routes.

### Route Definitions
```javascript
router.post("/add", protect, addIncome);
router.get("/get", protect, getAllIncome);
router.get("/downloadexcel", protect, downloadIncomeExcel);
router.delete("/:id", protect, deleteIncome);
```

**Route Structure:**
- First parameter: URL path
- Second parameter: `protect` middleware (authentication required)
- Third parameter: Controller function to execute

**URL Parameters:**
- `/:id` in delete route creates a parameter accessible via `req.params.id`

---

## 5. Auth Routes (routes/authRoutes.js)

### Image Upload Route
```javascript
router.post("/upload-image", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
    }`;
    res.status(200).json({ imageUrl });
});
```

**Middleware Chain:**
1. `upload.single("image")`: Multer processes single file with field name "image"
2. Anonymous function: Handles the upload result

**URL Construction:**
- `req.protocol`: "http" or "https"
- `req.get("host")`: Server hostname and port (e.g., "localhost:8000")
- `req.file.filename`: Generated filename from multer
- Result: "http://localhost:8000/uploads/1759008575376-profile.jpg"

---

## 6. Server Configuration (server.js)

### New Additions
```javascript
const incomeRoutes = require("./routes/incomeRoutes");
```
**Import:** Loads income route definitions.

```javascript
app.use("/api/v1/income", incomeRoutes);
```
**Route Mounting:** Makes income routes available under `/api/v1/income` prefix.

```javascript
// Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
```
**Static File Serving:**
- `express.static()`: Middleware to serve static files
- `path.join(__dirname, "uploads")`: Constructs absolute path to uploads folder
- Makes uploaded files accessible via HTTP (e.g., `http://localhost:8000/uploads/image.jpg`)

---

## System Workflow

### Adding Income:
1. Client sends POST to `/api/v1/income/add` with JWT token
2. `protect` middleware validates token and sets `req.user`
3. `addIncome` controller validates data and saves to database
4. Server responds with created income record

### Retrieving Income:
1. Client sends GET to `/api/v1/income/get` with JWT token
2. Authentication middleware validates user
3. `getAllIncome` finds user's income records, sorts by date
4. Server responds with array of income documents

### File Upload:
1. Client sends POST to `/api/v1/auth/upload-image` with multipart form
2. `upload.single("image")` middleware processes file
3. File saved to `uploads/` directory with timestamp prefix
4. Server responds with accessible URL

### Excel Download:
1. Client sends GET to `/api/v1/income/downloadexcel` with JWT token
2. Controller retrieves user's income data
3. Data transformed to Excel format using xlsx library
4. File saved to server and sent to client for download

---

## Security Considerations

**Implemented Security:**
- JWT authentication on all income routes
- File type validation for uploads
- User-specific data isolation (using userId)

**Security Gaps:**
- Delete function doesn't verify ownership
- No rate limiting on uploads
- Excel files saved to server filesystem (cleanup needed)
- No file size limits on uploads

**Recommended Improvements:**
```javascript
// In deleteIncome function:
const income = await Income.findOneAndDelete({ 
    _id: req.params.id, 
    userId: req.user.id 
});
if (!income) {
    return res.status(404).json({ message: "Income not found or unauthorized" });
}
```

This system provides a complete CRUD interface for income management with file handling capabilities, integrated into the existing authentication system.