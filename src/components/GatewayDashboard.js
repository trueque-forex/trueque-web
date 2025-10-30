import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function GatewayDashboard({ transactions }) {
    const gateways = Array.from(new Set(transactions.map((tx) => tx.gateway)));
    return (_jsxs("div", { className: "max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Gateway Dashboard" }), gateways.length === 0 ? (_jsx("p", { className: "text-gray-500", children: "No transactions yet." })) : (_jsx("ul", { className: "space-y-2", children: gateways.map((gateway, index) => {
                    const count = transactions.filter((tx) => tx.gateway === gateway).length;
                    const fallbackUsed = gateway === "Fallback";
                    return (_jsxs("li", { className: "p-3 bg-gray-100 rounded border", children: [_jsxs("div", { children: [_jsx("strong", { children: "Gateway:" }), " ", gateway] }), _jsxs("div", { children: [_jsx("strong", { children: "Usage Count:" }), " ", count] }), fallbackUsed && _jsx("div", { className: "text-red-600", children: _jsx("strong", { children: "Fallback triggered due to missing or unsupported input" }) })] }, index));
                }) }))] }));
}
