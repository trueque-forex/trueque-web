"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateIntegrityCard = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_i18next_1 = require("react-i18next");
const RateIntegrityCard = ({ fx_rate_market, user_rate, effective_rate, fee_breakdown, userRole }) => {
    const { t } = (0, react_i18next_1.useTranslation)();
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.card, children: [(0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.title, children: ["\uD83D\uDCCA ", t('fx.title')] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.label, children: [t('fx.marketRate'), ":"] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: fx_rate_market }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.label, children: [userRole === 'sender' ? t('fx.sendRate') : t('fx.receiveRate'), ":"] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: user_rate }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.label, children: [t('fx.effectiveRate'), ":"] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: effective_rate }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.label, children: [t('fee.title'), ":"] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.value, children: [t('fee.trueque'), ": ", fee_breakdown.trueque_fee, "%", '\n', t('fee.transmitter'), ": ", fee_breakdown.transmitter_fee, "%", '\n', t('fee.delivery'), ": ", fee_breakdown.delivery_premium, "%", '\n', t('fee.total'), ": ", fee_breakdown.total, "%"] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.label, children: [t('fee.deliveryChoice'), ":"] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.value, children: [fee_breakdown.delivery_choice === 'instant' && t('delivery.instant'), fee_breakdown.delivery_choice === 'same_day' && t('delivery.sameDay'), fee_breakdown.delivery_choice === 'next_day' && t('delivery.nextDay'), fee_breakdown.delivery_choice === 'batch' && t('delivery.batch')] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.footer, children: t('fx.footer') })] }));
};
exports.RateIntegrityCard = RateIntegrityCard;
const styles = react_native_1.StyleSheet.create({
    card: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        elevation: 2
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8
    },
    value: {
        fontSize: 14,
        color: '#333'
    },
    footer: {
        fontSize: 14,
        color: '#555',
        marginTop: 16
    }
});
//# sourceMappingURL=RateIntegrityCard.js.map