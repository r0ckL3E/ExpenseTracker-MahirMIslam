const express = require("express");
const {
    addExpense,
    getAllExpense,
    deleteExpense,
    downloadExpenseExcel
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const { categorizeExpense } = require("../services/aiService");

const router = express.Router();

router.post("/add", protect, addExpense);
router.get("/get", protect, getAllExpense);
router.get("/downloadexcel", protect, downloadExpenseExcel);
router.delete("/:id", protect, deleteExpense);

// AI categorization route
router.post("/ai-categorize", protect, async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: "Description required" });
    }

    const result = await categorizeExpense(description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      message: "Categorization failed", 
      error: error.message 
    });
  }
});

module.exports = router;