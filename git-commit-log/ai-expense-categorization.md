🤖 AI Expense Categorization – Full Project Documentation
📌 Overview


This feature uses a Hugging Face zero-shot classification model to automatically categorize user expenses based on a natural language description.
It works across the entire stack:


Frontend ➝ useAICategorization hook ➝ Express API (/ai-categorize)
       ➝ aiService (Hugging Face API) ➝ Model inference
       ➝ Response ➝ Suggestion rendered in AddExpenseForm


🧠 How It Works – Step by Step
1. Frontend Form: AddExpenseForm.jsx

This is the user interface where expenses are added.
The critical part is the description field which triggers AI categorization:

const [expense, setExpense] = useState({
  category: "",
  amount: "",
  date: "",
  icon: "",
  description: "", // <-- natural language input
});

🧠 handleDescriptionChange


This function fires whenever the description input changes:

const handleDescriptionChange = async (e) => {
  const description = e.target.value;
  handleChange("description", description);

  // ✅ Trigger AI if description is long enough
  if (description.length > 5) {
    const result = await categorizeExpense(description);
    if (result && result.category) {
      setSuggestedCategory(result.category);

      // ✅ Optional: auto-fill category if confidence > 0.7
      if (result.confidence > 0.7) {
        handleChange("category", result.category);
      }
    }
  } else {
    setSuggestedCategory("");
  }
};


Explanation:
✏️ description is updated in React state.
🧠 categorizeExpense(description) calls a custom hook that makes a backend API request.
📊 If a valid category is returned, it’s displayed to the user.
🎯 If the model is confident (confidence > 0.7), the category field is auto-filled.


2. Frontend Hook: useAICategorization.jsx

This custom React hook handles calling the backend API:

const response = await axiosInstance.post(
  API_PATHS.EXPENSE.AI_CATEGORIZE,
  { description }
);

📡 Sends a POST request to /api/v1/expense/ai-categorize.
📥 description is included in the body.
🔄 Returns the backend’s response { category, confidence, allPredictions }.


3. Backend Route: expenseRoutes.js

The Express route receives the request and calls the AI service:

router.post("/ai-categorize", protect, async (req, res) => {
  try {
    const { description } = req.body;

    // 🛑 Basic validation
    if (!description) {
      return res.status(400).json({ message: "Description required" });
    }

    // 🧠 Call AI service
    const result = await categorizeExpense(description);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Categorization failed",
      error: error.message
    });
  }
});

Explanation:
🔐 protect middleware ensures only authenticated users can access.
🧠 Calls categorizeExpense(description) in aiService.js.
📤 Returns the prediction result back to the frontend.


4. Backend AI Service: aiService.js

This is where Hugging Face inference happens.

const { HfInference } = require('@huggingface/inference');
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const EXPENSE_CATEGORIES = [
  "Food & Dining", "Transportation", "Shopping", "Entertainment",
  "Bills & Utilities", "Healthcare", "Education", "Travel",
  "Personal Care", "Other"
];


The main logic:

exports.categorizeExpense = async (description) => {
  try {
    const result = await hf.zeroShotClassification({
      model: "typeform/distilbert-base-uncased-mnli",
      inputs: description,
      parameters: {
        candidate_labels: EXPENSE_CATEGORIES,
      },
    });

    console.log("🔍 Raw AI result:", JSON.stringify(result, null, 2));

    // ✅ Handle Hugging Face response structure
    if (Array.isArray(result) && result[0]?.label) {
      return {
        category: result[0].label,
        confidence: result[0].score,
        allPredictions: result.slice(0, 3).map(r => ({
          category: r.label,
          confidence: r.score
        })),
      };
    }

    throw new Error("Unexpected AI response structure");
  } catch (error) {
    console.error("AI categorization failed:", error);
    return { category: "Other", confidence: 0, error: error.message };
  }
};


Explanation of Key Lines:

| Line                               | Meaning                                                                       |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `const hf = new HfInference(...)`  | Creates a Hugging Face API client using your API key.                         |
| `hf.zeroShotClassification({...})` | Calls the hosted model to classify text into one of the `EXPENSE_CATEGORIES`. |
| `candidate_labels`                 | Possible categories the model will choose from.                               |
| `result[0].label`                  | The most likely category label (highest confidence).                          |
| `result[0].score`                  | Confidence score between 0 and 1.                                             |
| `slice(0, 3)`                      | Returns the top 3 category predictions.                                       |
| `catch (...)`                      | If inference fails, default to `"Other"`.                                     |


🔁 Full Request Flow
[1] User types "Bought coffee at Starbucks"
      ⬇
[2] handleDescriptionChange() calls categorizeExpense()
      ⬇
[3] useAICategorization sends POST /api/v1/expense/ai-categorize
      ⬇
[4] Express route validates input and calls aiService.categorizeExpense()
      ⬇
[5] aiService sends request to Hugging Face API
      ⬇
[6] Model responds with category predictions
      ⬇
[7] Backend formats and returns response JSON
      ⬇
[8] Frontend shows "AI suggests: Food & Dining"


📊 Sample Response
{
  "category": "Food & Dining",
  "confidence": 0.89,
  "allPredictions": [
    { "category": "Food & Dining", "confidence": 0.89 },
    { "category": "Shopping", "confidence": 0.06 },
    { "category": "Entertainment", "confidence": 0.05 }
  ]
}


🧪 How to Test the AI

Try entering the following in the description field:

| Description                | Expected AI Suggestion   |
| -------------------------- | ------------------------ |
| Bought coffee at Starbucks | ☕ **Food & Dining**      |
| Monthly bus pass           | 🚌 **Transportation**    |
| Netflix subscription       | 📺 **Entertainment**     |
| Paid electricity bill      | 💡 **Bills & Utilities** |
| Doctor appointment         | 🩺 **Healthcare**        |


🧰 Summary of Key Files
| File                                                 | Purpose                                               |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `frontend/src/components/Expense/AddExpenseForm.jsx` | UI for adding expenses & triggering AI categorization |
| `frontend/src/hooks/useAICategorization.jsx`         | Handles API calls to backend for classification       |
| `backend/routes/expenseRoutes.js`                    | Defines `/ai-categorize` endpoint                     |
| `backend/services/aiService.js`                      | Integrates Hugging Face inference API                 |
| `.env`                                               | Must contain `HUGGINGFACE_API_KEY`                    |


Result:
Users now get real-time AI-powered category suggestions while entering expenses, improving accuracy and user experience with minimal manual input.