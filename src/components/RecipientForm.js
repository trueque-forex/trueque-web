import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const RecipientForm = ({ onSubmit }) => {
    const handleSubmit = () => {
        const newRecipient = {
            name: 'Luis',
            email: 'luis@example.com',
            country: 'US',
        };
        onSubmit(newRecipient);
    };
    return (_jsxs("div", { children: [_jsx("h2", { children: "Recipient Form" }), _jsx("button", { onClick: handleSubmit, children: "Submit Recipient" })] }));
};
export default RecipientForm;
