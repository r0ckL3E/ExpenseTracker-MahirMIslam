# Dashboard Components - Complete Technical Documentation

This document explains all dashboard components, their purpose, syntax, and integration with the backend API.

---

## Architecture Overview

```
Home.jsx (Main Dashboard Page)
    ↓
Fetches data from Backend API (/api/v1/dashboard)
    ↓
Distributes data to child components:
- InfoCard (x3) - Display totals
- RecentTransactions - Combined income/expense list
- FinanceOverview - Pie chart of financial breakdown
- ExpenseTransactions - Recent expenses
- Last30DaysExpenses - Bar chart of expenses
- RecentIncomeWithChart - Pie chart of income sources
- RecentIncome - Recent income list
```

---

## 1. Card Components

### CharAvatar.jsx - User Initial Display

```javascript
const CharAvatar = ({ fullName, width, height, style }) => {
  return <div className={`${width || 'w-12'} ${height || 'h-12'} ${
    style || ''
    } flex items-center justify-center rounded-full text-gray-900 font-medium bg-gray-100`}
    >
        {getInitials(fullName || "")}
  </div>;
};
```

**Purpose:** Displays user initials in a circular avatar when no profile image exists.

**Props:**
- `fullName`: User's full name from backend
- `width`, `height`, `style`: Optional Tailwind classes for customization

**Helper Function Used:**
```javascript
export const getInitials = (name) => {
    if (!name) return "";
    const words = name.split(" ");
    let initials = "";
    for (let i = 0; i < Math.min(words.length, 2); i++) {
        initials += words[i][0];
    }
    return initials.toUpperCase();
};
```

**Logic:**
- Splits name by spaces
- Takes first letter of first two words
- Converts to uppercase
- "John Doe" → "JD"

**Backend Connection:**
```javascript
// Backend: authController.js returns user data
res.json({ user: { fullName: "John Doe", ... } });

// Frontend: UserContext stores this
const { user } = useContext(UserContext);

// SideMenu displays avatar
<CharAvatar fullName={user?.fullName} />
```

---

### InfoCard.jsx - Summary Statistics Cards

```javascript
const InfoCard = ({ icon, label, value, color }) => {
    return <div className="flex gap-6 bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50">
        <div className={`w-14 h-14 flex items-center justify-center text-[26px] text-white ${color} rounded-full drop-shadow-xl`}>
            {icon}
        </div>
        <div>
            <h6 className="text-sm text-gray-500 mb-1">{label}</h6>
            <span className="text-[22px]">${value}</span>
        </div>
    </div>;
};
```

**Purpose:** Displays key financial metrics at dashboard top.

**Props:**
- `icon`: React icon component (e.g., `<IoMdCard />`)
- `label`: Descriptive text ("Total Balance")
- `value`: Formatted number string with thousands separator
- `color`: Tailwind background color class

**Usage in Home.jsx:**
```javascript
<InfoCard
  icon={<IoMdCard />}
  label="Total Balance"
  value={addThousandsSeparator(dashboardData?.totalBalance || 0)}
  color="bg-primary"
/>
```

**Backend Connection:**
```javascript
// Backend: dashboardController.js
res.json({
  totalBalance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
  totalIncome: totalIncome[0]?.total || 0,
  totalExpenses: totalExpense[0]?.total || 0,
});

// Frontend receives and displays
dashboardData?.totalBalance // → InfoCard value
```

**Thousands Separator Helper:**
```javascript
export const addThousandsSeparator = (num) => {
    if (num == null || isNaN(num)) return "";
    const [integerPart, fractionalPart] = num.toString().split(".");
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fractionalPart
    ? `${formattedInteger}.${fractionalPart}`
    :  formattedInteger;
};
```

**Logic:**
- Splits number into integer and fractional parts
- Regex adds commas every 3 digits: `5300` → `"5,300"`
- Preserves decimal places if present

---

### TransactionInfoCard.jsx - Individual Transaction Display

```javascript
const TransactionInfoCard = ({
    title,
    icon,
    date,
    amount,
    type,
    hideDeleteBtn,
}) => {
    const getAmountStyles = () =>
        type === "income" ? "bg-green-50 text-green-500" : "bg-red-50 text-red-500";
```

**Purpose:** Displays single transaction with icon, details, and amount indicator.

**Dynamic Styling Function:**
- Income: Green background (`bg-green-50`) with green text
- Expense: Red background (`bg-red-50`) with red text

```javascript
<div className="w-12 h-12 flex items-center justify-center text-xl text-gray-800 bg-gray-100 rounded-full">
    {icon ? (
        <img src={icon} alt={title} className="w-6 h-6"/>
    ) : (
        <LuUtensils />
    )}
</div>
```

**Icon Logic:**
- If `icon` URL provided: Display image
- If no icon: Show default utensils icon

```javascript
{!hideDeleteBtn && (
    <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
    onClick={onDelete}>
        <LuTrash2 size={18} />
    </button>
)}
```

**Conditional Delete Button:**
- `hideDeleteBtn` prop hides button
- `opacity-0` makes invisible by default
- `group-hover:opacity-100` shows on card hover
- Used for dashboard (view-only) vs transaction pages (can delete)

```javascript
<h6 className="text-xs font-medium">
    {type === "income" ? "+" : "-"} ${amount}
</h6>
{type === "income" ? <LuTrendingUp /> : <LuTrendingDown />}
```

**Amount Display:**
- Prefix with `+` for income, `-` for expense
- Shows trending up/down icon based on type

**Backend Connection:**
```javascript
// Backend: dashboardController.js returns combined transactions
recentTransactions: [
  { _id: "...", category: "Rent", amount: 1200, date: "...", type: "expense" },
  { _id: "...", source: "Salary", amount: 5000, date: "...", type: "income" }
]

// Frontend maps over array
{transactions?.map((item) => (
  <TransactionInfoCard
    title={item.type == 'expense' ? item.category : item.source}
    amount={item.amount}
    type={item.type}
  />
))}
```

---

## 2. Chart Components

### CustomBarChart.jsx - Bar Chart Visualization

```javascript
const getBarColor = (index) => {
    return index % 2 === 0 ? "#875cf5" : "#cfbefb"
}
```

**Alternating Colors:**
- Even indices: Purple (`#875cf5`)
- Odd indices: Light purple (`#cfbefb`)
- Creates visual separation between bars

```javascript
const CustomToolTip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className='bg-white shadow-md rounded-lg p-2 border border-gray-300'>
                <p className='text-xs font-semibold text-purple-800 mb-1'>
                    {payload[0].payload.category}
                </p>
                <p className='text-sm text-gray-600'>
                    Amount: <span className='text-sm font-medium text-gray-900'>
                        ${payload[0].payload.amount}
                    </span>
                </p>
            </div>
        )
    }
    return null;
};
```

**Custom Tooltip:**
- `active`: True when hovering over bar
- `payload`: Array containing bar data
- `payload[0].payload`: Actual data object (category, amount)
- Displays formatted tooltip on hover

```javascript
<ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
        <CartesianGrid stroke="none" />
        <XAxis dataKey={dataKey} tick={{ fontSize: 12, fill: "#555" }} stroke= "none" />
        <YAxis tick={{ fontSize: 12, fill: "#555" }} />
        <Tooltip content={CustomToolTip} />
        <Bar dataKey="amount" fill="#FF8042" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
                <Cell key={index} fill={getBarColor(index)} />
            ))}
        </Bar>
    </BarChart>
</ResponsiveContainer>
```

**Chart Configuration:**
- `ResponsiveContainer`: Auto-adjusts to parent width
- `CartesianGrid stroke="none"`: Hides grid lines
- `XAxis dataKey={dataKey}`: X-axis uses category names
- `radius={[10, 10, 0, 0]}`: Rounded top corners
- `Cell`: Individual bar styling with alternating colors

**Backend Connection:**
```javascript
// Backend: last30DaysExpenses.transactions
[
  { category: "Rent", amount: 1200, date: "..." },
  { category: "Food", amount: 300, date: "..." }
]

// Frontend: prepareExpenseBarChartData helper
export const prepareExpenseBarChartData = (data = []) => {
    const chartData = data.map((item) => ({
        category: item?.category,
        amount: item?.amount,
    }));
    return chartData;
}

// Result: [{ category: "Rent", amount: 1200 }, { category: "Food", amount: 300 }]
// Bar chart displays with category on X-axis, amount as bar height
```

---

### CustomPieChart.jsx - Donut Chart Visualization

```javascript
<Pie
  data={data}
  dataKey={"amount"}
  nameKey={"name"}
  cx="50%"
  cy="50%"
  outerRadius={130}
  innerRadius={100}
  labelLine={false}
>
```

**Pie Configuration:**
- `dataKey="amount"`: Determines slice sizes
- `nameKey="name"`: Labels for legend
- `cx="50%", cy="50%"`: Center position
- `outerRadius={130}, innerRadius={100}`: Creates donut (ring) shape
- `labelLine={false}`: No lines pointing to slices

```javascript
{data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
))}
```

**Dynamic Coloring:**
- Maps over data array
- Assigns color from `colors` array prop
- `index % colors.length`: Cycles through colors if more data than colors

```javascript
{showTextAnchor && (
    <>
    <text x="50%" y="50%" dy={-25} textAnchor="middle" fill="#666" fontSize="14px">
        {label}
    </text>
    <text x="50%" y="50%" dy={8} textAnchor="middle" fill="#333" fontSize="24px" fontWeight="semi-bold">
        {totalAmount}
    </text>
  </>
)}
```

**Center Text (SVG text elements):**
- `x="50%", y="50%"`: Center horizontally and vertically
- `dy={-25}`: Offset label upward
- `dy={8}`: Offset amount downward
- Displays total in center of donut chart

**Backend Connection:**
```javascript
// Backend: last60DaysIncome.transactions
[
  { source: "Salary", amount: 5000, date: "..." },
  { source: "Freelance", amount: 1500, date: "..." }
]

// Frontend: RecentIncomeWithChart prepares data
const prepareChartData = () => {
    const dataArr = data.map((item)=>({
        name: item?.source,
        amount: item?.amount,
    }))
    setChartData(dataArr);
}

// Result: [{ name: "Salary", amount: 5000 }, { name: "Freelance", amount: 1500 }]
// Pie chart shows proportional slices
```

---

## 3. Dashboard Container Components

### Last30DaysExpenses.jsx - Bar Chart Container

```javascript
const [chartData, setChartData] = useState([])

useEffect(() => {
    const result = prepareExpenseBarChartData(data)
    setChartData(result)
    return () => { }
}, [data])
```

**Data Preparation:**
- `useEffect` runs when `data` prop changes
- Transforms backend data into chart-friendly format
- Updates local state with prepared data

**Backend Connection:**
```javascript
// Home.jsx passes backend data
<Last30DaysExpenses
  data={dashboardData?.last30DaysExpenses?.transactions}
/>

// Backend structure:
last30DaysExpenses: {
  total: 1500,
  transactions: [
    { userId: "...", category: "Rent", amount: 1200, date: "...", icon: "" },
    { userId: "...", category: "Food", amount: 300, date: "...", icon: "" }
  ]
}
```

---

### RecentIncomeWithChart.jsx - Income Pie Chart Container

```javascript
const prepareChartData = () => {
    const dataArr = data.map((item)=>({
        name: item?.source,
        amount: item?.amount,
    }))
    setChartData(dataArr);
}
```

**Data Transformation:**
- Extracts only needed fields (`source` → `name`, `amount`)
- Removes unnecessary fields (date, userId, etc.)
- Optimizes for chart rendering

```javascript
<CustomPieChart
    data={chartData}
    label="Total Income"
    totalAmount={`$${totalIncome}`}
    showTextAnchor
    colors={COLORS}
/>
```

**Prop Passing:**
- `totalAmount`: Formatted total from backend aggregation
- `showTextAnchor`: Enables center text display
- `colors`: Predefined color array for slices

---

## 4. Layout Components

### DashboardLayout.jsx - Page Wrapper

```javascript
const { user } = useContext(UserContext);
return (
    <div className="">
        <Navbar activeMenu={activeMenu} />
        {user && (
            <div className="flex">
                <div className="max-[1080px]:hidden">
                    <SideMenu activeMenu={activeMenu} />
                </div>
                <div className="grow mx-5">{children}</div>
            </div>
        )}
    </div>
)
```

**Layout Structure:**
- Navbar at top (always visible)
- Conditional rendering: Only show content if user authenticated
- Responsive sidebar: Hidden below 1080px width (`max-[1080px]:hidden`)
- `{children}`: Renders page content (Home, Income, Expense pages)

**Backend Connection:**
```javascript
// UserContext populated by useUserAuth hook
// Fetches user data from GET /api/v1/auth/getUser
const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
updateUser(response.data);

// If fetch fails (invalid token), redirects to login
```

---

### Navbar.jsx - Top Navigation Bar

```javascript
const [openSideMenu, setOpenSideMenu] = useState(false);
```

**Mobile Menu State:**
- Tracks whether mobile sidebar is open
- Toggles on hamburger icon click

```javascript
<button
  className="block lg:hidden text-black"
  onClick={() => setOpenSideMenu(!openSideMenu)}
> 
  {openSideMenu ? (
      <HiOutlineX className="text-2xl" />
  ) : (
      <HiOutlineMenu className="text-2xl" />
  )}
</button>
```

**Responsive Toggle:**
- `block lg:hidden`: Only visible on small screens
- Icon changes: Menu (☰) ↔ Close (✕)
- Toggles mobile sidebar visibility

---

### SideMenu.jsx - Navigation Sidebar

```javascript
const handleClick = (route) => {
    if (route === "logout") {
        handleLogout();
        return;
    }
    navigate(route);
};

const handleLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/login");
};
```

**Navigation Logic:**
- Special handling for logout: Clears storage and context
- Other routes: Standard navigation
- `localStorage.clear()`: Removes JWT token
- `clearUser()`: Resets UserContext to null
- Redirects to login page

```javascript
{SIDE_MENU_DATA.map((item, index) => (
    <button
    className={`w-full flex items-center gap-4 text-[15px] ${
        activeMenu == item.label ? "text-white bg-primary" : ""
    } py-3 px-6 rounded-lg mb-3`}
    onClick={() => handleClick(item.path)}
    >
    <item.icon className="text-xl" />
    {item.label}
    </button>
))}
```

**Dynamic Menu Items:**
- Maps over `SIDE_MENU_DATA` array
- Highlights active page with purple background
- Each item has icon and label from data.js

**data.js Structure:**
```javascript
export const SIDE_MENU_DATA = [
    { id:"01", label: 'Dashboard', icon: LuLayoutDashboard, path: "/dashboard" },
    { id: "02", label: "Income", icon: LuWalletMinimal, path: "/income" },
    { id: "03", label: "Expense", icon: LuHandCoins, path: "/expense" },
    { id: "06", label: "Logout", icon: LuLogOut, path: "logout" },
];
```

---

## 5. useUserAuth Hook - Authentication Guard

```javascript
export const useUserAuth = () => {
    const {user, updateUser, clearUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) return;  // Already have user data
```

**Purpose:** Fetches user data on protected pages, redirects if unauthorized.

**Early Return:**
- If `user` exists in context, skip API call
- Prevents unnecessary requests

```javascript
let isMounted = true;

const fetchUserInfo = async () => {
    try {
        const response = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
        if (isMounted && response.data) {
            updateUser(response.data);
        }
    } catch (error) {
        console.error("Failed to fetch user info:", error);
        if (isMounted) {
            clearUser();
            navigate("/login");
        }
    }
};

fetchUserInfo();

return () => {
    isMounted = false;
};
```

**Cleanup Pattern:**
- `isMounted` flag prevents state updates after unmount
- Catches 401 errors (invalid token) and redirects
- Cleanup function sets flag to false on unmount

**Backend Connection:**
```javascript
// GET /api/v1/auth/getUser
// Protected by authMiddleware.protect
router.get("/getUser", protect, getUserInfo);

// Backend validates JWT, returns user data
exports.getUserInfo = async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json(user);
};
```

---

## Complete Data Flow Example

### User Opens Dashboard:

```
1. Browser loads Home.jsx
   ↓
2. useUserAuth() hook runs
   ↓
3. Checks UserContext - empty on first load
   ↓
4. GET /api/v1/auth/getUser (with JWT from localStorage)
   ↓
5. Backend authMiddleware validates token
   ↓
6. Backend returns user data
   ↓
7. updateUser() stores in context
   ↓
8. DashboardLayout renders (user exists now)
   ↓
9. fetchDashboardData() runs in useEffect
   ↓
10. GET /api/v1/dashboard
    ↓
11. Backend performs 6 MongoDB queries:
    - Aggregate total income
    - Aggregate total expenses
    - Find last 60 days income
    - Find last 30 days expenses
    - Find last 5 income
    - Find last 5 expenses
    ↓
12. Backend combines data and calculates totals
    ↓
13. Returns JSON response
    ↓
14. setDashboardData() updates state
    ↓
15. Components receive data via props
    ↓
16. InfoCards display totals with formatters
17. Charts transform data and render visualizations
18. Transaction lists map over arrays
```

---

## Styling System (index.css)

```css
@theme {
  --color-primary: #875cf5;
}
```

**Custom Tailwind Theme:**
- Defines `bg-primary` and `text-primary` classes
- Purple color used throughout dashboard

```css
.card {
  @apply bg-white p-6 rounded-2xl shadow-md shadow-gray-100 border border-gray-200/50;
}
```

**Reusable Card Style:**
- Applied to all dashboard component containers
- Consistent look across application

```css
.card-btn {
  @apply flex items-center gap-3 text-[12px] font-medium text-gray-700 hover:text-purple-500 bg-gray-50 hover:bg-purple-50 px-4 py-1.5 rounded-lg border border-gray-200/50 cursor-pointer;
}
```

**Button Style:**
- Used for "See All" buttons
- Hover effect changes color to purple

This dashboard system provides real-time financial visualization by integrating React components with backend aggregation APIs, using Recharts for data visualization and Tailwind CSS for consistent styling.