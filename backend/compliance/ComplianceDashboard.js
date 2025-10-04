"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ComplianceDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
function ComplianceDashboard({ transactions }) {
    const getTotals = () => {
        const now = new Date();
        const monthlyCutoff = new Date(now);
        monthlyCutoff.setDate(now.getDate() - 30);
        const sixMonthCutoff = new Date(now);
        sixMonthCutoff.setDate(now.getDate() - 180);
        let monthlyTotal = 0;
        let sixMonthTotal = 0;
        for (const tx of transactions) {
            const txTime = new Date(tx.timestamp);
            const amount = 250; // Replace with actual amount logic
            if (txTime > monthlyCutoff)
                monthlyTotal += amount;
            if (txTime > sixMonthCutoff)
                sixMonthTotal += amount;
        }
        return { monthlyTotal, sixMonthTotal };
    };
    const { monthlyTotal, sixMonthTotal } = getTotals();
    return ((0, jsx_runtime_1.jsxs)("div", { className: "max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-xl font-bold mb-4", children: "Compliance Dashboard" }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Monthly Total:" }), " $", monthlyTotal.toFixed(2), " / $3,000", monthlyTotal >= 3000 && (0, jsx_runtime_1.jsx)("span", { className: "text-red-600 ml-2", children: "\u26A0\uFE0F Limit Exceeded" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("strong", { children: "Six-Month Total:" }), " $", sixMonthTotal.toFixed(2), " / $6,000", sixMonthTotal >= 6000 && (0, jsx_runtime_1.jsx)("span", { className: "text-red-600 ml-2", children: "\u26A0\uFE0F Limit Exceeded" })] }), (0, jsx_runtime_1.jsx)("h3", { className: "font-semibold mt-6 mb-2", children: "Audit Log" }), (0, jsx_runtime_1.jsx)("ul", { className: "space-y-2 text-sm", children: transactions.map((tx, i) => ((0, jsx_runtime_1.jsxs)("li", { className: "p-3 bg-gray-100 rounded border", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Timestamp:" }), " ", tx.timestamp] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Gateway:" }), " ", tx.gateway] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Recipient:" }), " ", tx.recipient, " (", tx.relationship, ")"] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("strong", { children: "Status:" }), " ", tx.status] })] }, i))) })] }));
}
//# sourceMappingURL=ComplianceDashboard.js.map