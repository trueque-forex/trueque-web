import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function TransactionHistory({ transactions }) {
    const [filter, setFilter] = useState({
        gateway: "",
        country: "",
    });
    const filtered = transactions.filter((tx) => {
        const matchesGateway = filter.gateway ? tx.gateway === filter.gateway : true;
        const matchesCountry = filter.country ? tx.tx_id.includes(`_${filter.country}`) : true;
        return matchesGateway && matchesCountry;
    });
    return (_jsxs("div", { className: "max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Transaction History" }), _jsxs("div", { className: "flex gap-4 mb-4", children: [_jsxs("select", { onChange: (e) => setFilter((f) => ({ ...f, gateway: e.target.value })), className: "p-2 border rounded w-1/2", children: [_jsx("option", { value: "", children: "All Gateways" }), _jsx("option", { value: "PIX", children: "PIX" }), _jsx("option", { value: "SPEI", children: "SPEI" }), _jsx("option", { value: "VisaDirect", children: "Visa Direct" }), _jsx("option", { value: "WalletAPI", children: "Wallet" }), _jsx("option", { value: "Fallback", children: "Fallback" })] }), _jsxs("select", { onChange: (e) => setFilter((f) => ({ ...f, country: e.target.value })), className: "p-2 border rounded w-1/2", children: [_jsx("option", { value: "", children: "All Countries" }), _jsx("option", { value: "BR", children: "Brazil" }), _jsx("option", { value: "MX", children: "Mexico" }), _jsx("option", { value: "US", children: "United States" })] })] }), filtered.length === 0 ? (_jsx("p", { className: "text-gray-500", children: "No transactions match your filters." })) : (_jsx("ul", { className: "space-y-2", children: filtered.map((tx, index) => (_jsxs("li", { className: "p-3 bg-gray-100 rounded border", children: [_jsxs("div", { children: [_jsx("strong", { children: "Gateway:" }), " ", tx.gateway] }), _jsxs("div", { children: [_jsx("strong", { children: "Tx ID:" }), " ", tx.tx_id] }), _jsxs("div", { children: [_jsx("strong", { children: "Status:" }), " ", tx.status] }), _jsxs("div", { children: [_jsx("strong", { children: "Timestamp:" }), " ", tx.timestamp] })] }, index))) }))] }));
}
