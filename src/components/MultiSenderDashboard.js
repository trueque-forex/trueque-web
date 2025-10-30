import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FeeAttribution } from '../protocol/FeeAttribution';
const MultiSenderDashboard = () => {
    const [fees, setFees] = useState([]);
    const calculateFees = () => {
        const results = [FeeAttribution.calculate( /* args */)];
        setFees(results);
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Multi-Sender Dashboard" }), _jsx("button", { onClick: calculateFees, children: "Calculate Fees" }), fees.map((fee, i) => (_jsxs("p", { children: ["Fee ", i + 1, ": ", fee] }, i)))] }));
};
export default MultiSenderDashboard;
