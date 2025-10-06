import React, { useState } from 'react'
import Input from '../Inputs/Input'
import EmojiPickerPopUp from '../EmojiPickerPopUp'
import { useAICategorization } from '../../hooks/useAICategorization'

const AddExpenseForm = ({ onAddExpense }) => {
    const [expense, setExpense] = useState({
        category: "",
        amount: "",
        date: "",
        icon: "",
        description: "",  // NEW: for AI categorization
    })

    const [suggestedCategory, setSuggestedCategory] = useState("");
    const { categorizeExpense, loading: aiLoading } = useAICategorization();

    const handleChange = (key, value) => setExpense({ ...expense, [key]: value })

    // AI categorization when description changes
    const handleDescriptionChange = async (e) => {
        const description = e.target.value;
        handleChange("description", description);

        // Trigger AI categorization if description is long enough
        if (description.length > 5) {
            const result = await categorizeExpense(description);
            if (result && result.category) {
                setSuggestedCategory(result.category);
                // Auto-fill category if confidence is high
                if (result.confidence > 0.7) {
                    handleChange("category", result.category);
                }
            }
        } else {
            setSuggestedCategory("");
        }
    }

    return (
        <div>
            <EmojiPickerPopUp
                icon={expense.icon}
                onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
            />

            {/* NEW: Description field */}
            <Input
                value={expense.description}
                onChange={handleDescriptionChange}
                label="Description (AI will suggest category)"
                placeholder="e.g., Bought coffee at Starbucks"
                type="text"
            />

            {/* Show AI suggestion */}
            {suggestedCategory && (
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-xs text-purple-700">
                        {aiLoading ? "🤖 AI is thinking..." : `🤖 AI suggests: ${suggestedCategory}`}
                    </p>
                </div>
            )}

            <Input
                value={expense.category}
                onChange={({ target }) => handleChange("category", target.value)}
                label="Category"
                placeholder="Rent, Groceries, etc."
                type="text"
            />

            <Input
                value={expense.amount}
                onChange={({ target }) => handleChange("amount", target.value)}
                label="Amount"
                placeholder="1200"
                type="number"
            />

            <Input
                value={expense.date}
                onChange={({ target }) => handleChange("date", target.value)}
                label="Date"
                placeholder=""
                type="date"
            />

            <div className="flex justify-end mt-6">
                <button
                    type='button'
                    className='add-btn add-btn-fill'
                    onClick={() => onAddExpense(expense)}
                >
                    Add Expense
                </button>
            </div>
        </div>
    )
};

export default AddExpenseForm;