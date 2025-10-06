const { HfInference } = require("@huggingface/inference");

// Initialize Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Define expense categories
const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Personal Care",
  "Other",
];

/**
 * Categorizes an expense description using AI
 */
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

    // If result is an array of {label, score}, handle it directly:
    if (Array.isArray(result) && result.length > 0 && result[0].label) {
      return {
        category: result[0].label,
        confidence: result[0].score,
        allPredictions: result.slice(0, 3).map((r) => ({
          category: r.label,
          confidence: r.score,
        })),
      };
    }

    // If it’s in the old format with labels/scores arrays
    if (result.labels && result.scores) {
      return {
        category: result.labels[0],
        confidence: result.scores[0],
        allPredictions: result.labels.slice(0, 3).map((label, i) => ({
          category: label,
          confidence: result.scores[i],
        })),
      };
    }

    throw new Error("Unexpected AI response structure");
  } catch (error) {
    console.error("AI categorization failed:", error);
    return {
      category: "Other",
      confidence: 0,
      error: error.message,
    };
  }
};