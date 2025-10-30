import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function RoutingFlow({ country, type }) {
    const gatewayMap = {
        BR: { bank: "PIX" },
        MX: { bank: "SPEI" },
        US: { debit_card: "VisaDirect", wallet: "WalletAPI" },
    };
    const gateway = gatewayMap[country]?.[type] || "Fallback";
    return (_jsxs("div", { className: "max-w-md mx-auto mt-6 p-4 bg-white rounded shadow", children: [_jsx("h3", { className: "text-lg font-semibold mb-2", children: "Routing Logic" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: ["\uD83C\uDF0D ", _jsx("strong", { children: "Country:" }), " ", country] }), _jsxs("div", { children: ["\uD83C\uDFE6 ", _jsx("strong", { children: "Type:" }), " ", type] }), _jsxs("div", { children: ["\uD83D\uDE80 ", _jsx("strong", { children: "Selected Gateway:" }), " ", gateway] }), gateway === "Fallback" && (_jsx("div", { className: "text-red-600", children: "\u26A0\uFE0F Fallback triggered due to unsupported combination" }))] })] }));
}
