import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { FeeAttribution } from '../protocol/FeeAttribution';
const FallbackUXDemo = () => {
    const [fee, setFee] = useState(null);
    const simulateFallback = () => {
        const result = FeeAttribution.calculate( /* args */);
        setFee(result);
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Fallback UX Demo" }), _jsx("button", { onClick: simulateFallback, children: "Run Fallback" }), fee !== null && _jsxs("p", { children: ["Fee: ", fee] })] }));
};
export default FallbackUXDemo;
