import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const RecipientOnboarding = ({ onComplete }) => {
    // Simulate onboarding completion
    const sampleRecipients = [
        { name: 'Ana', email: 'ana@example.com', country: 'MX' },
    ];
    const completeOnboarding = () => {
        onComplete(sampleRecipients);
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Recipient Onboarding" }), _jsx("button", { onClick: completeOnboarding, children: "Complete Onboarding" })] }));
};
export default RecipientOnboarding;
