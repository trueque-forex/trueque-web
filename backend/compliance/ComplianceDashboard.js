import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ComplianceDashboard({ transactions }) {
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
    return (_jsxs("div", { className: "max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Compliance Dashboard" }), _jsxs("div", { className: "mb-4", children: [_jsx("strong", { children: "Monthly Total:" }), " $", monthlyTotal.toFixed(2), " / $3,000", monthlyTotal >= 3000 && _jsx("span", { className: "text-red-600 ml-2", children: "\u26A0\uFE0F Limit Exceeded" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("strong", { children: "Six-Month Total:" }), " $", sixMonthTotal.toFixed(2), " / $6,000", sixMonthTotal >= 6000 && _jsx("span", { className: "text-red-600 ml-2", children: "\u26A0\uFE0F Limit Exceeded" })] }), _jsx("h3", { className: "font-semibold mt-6 mb-2", children: "Audit Log" }), _jsx("ul", { className: "space-y-2 text-sm", children: transactions.map((tx, i) => (_jsxs("li", { className: "p-3 bg-gray-100 rounded border", children: [_jsxs("div", { children: [_jsx("strong", { children: "Timestamp:" }), " ", tx.timestamp] }), _jsxs("div", { children: [_jsx("strong", { children: "Gateway:" }), " ", tx.gateway] }), _jsxs("div", { children: [_jsx("strong", { children: "Recipient:" }), " ", tx.recipient, " (", tx.relationship, ")"] }), _jsxs("div", { children: [_jsx("strong", { children: "Status:" }), " ", tx.status] })] }, i))) })] }));
}
