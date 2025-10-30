import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FeeAttribution } from '../protocol/FeeAttribution';
const FallbackTester = () => {
    const [fee, setFee] = useState(null);
    const simulate = () => {
        const result = FeeAttribution.calculate( /* args */);
        setFee(result);
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Fallback Tester" }), _jsx("button", { onClick: simulate, children: "Simulate" }), fee !== null && _jsxs("p", { children: ["Fee: ", fee] })] }));
};
export default FallbackTester;
