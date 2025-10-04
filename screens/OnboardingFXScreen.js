"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingFXScreen = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const react_i18next_1 = require("react-i18next");
const OnboardingFXScreen = () => {
    const { t } = (0, react_i18next_1.useTranslation)();
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: t('fx.title') }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.body, children: t('fx.body') }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.box, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: t('fx.marketRate') }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: "850 ARS/USD" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: t('fx.sendRate') }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: "845 ARS/USD" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: t('fx.receiveRate') }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: "855 ARS/USD" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: t('fx.spread') }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.value, children: "\u00B10.6%" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.footer, children: t('fx.footer') })] }));
};
exports.OnboardingFXScreen = OnboardingFXScreen;
const styles = react_native_1.StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    body: { fontSize: 14, marginBottom: 16 },
    box: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8 },
    label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    value: { fontSize: 14, color: '#333' },
    footer: { fontSize: 14, marginTop: 16, color: '#555' }
});
//# sourceMappingURL=OnboardingFXScreen.js.map