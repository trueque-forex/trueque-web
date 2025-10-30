"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingFXScreen = void 0;
var react_1 = require("react");
var react_native_1 = require("react-native");
var react_i18next_1 = require("react-i18next");
var OnboardingFXScreen = function () {
    var t = (0, react_i18next_1.useTranslation)().t;
    return (<react_native_1.View style={styles.container}>
      <react_native_1.Text style={styles.title}>{t('fx.title')}</react_native_1.Text>
      <react_native_1.Text style={styles.body}>{t('fx.body')}</react_native_1.Text>

      <react_native_1.View style={styles.box}>
        <react_native_1.Text style={styles.label}>{t('fx.marketRate')}</react_native_1.Text>
        <react_native_1.Text style={styles.value}>850 ARS/USD</react_native_1.Text>

        <react_native_1.Text style={styles.label}>{t('fx.sendRate')}</react_native_1.Text>
        <react_native_1.Text style={styles.value}>845 ARS/USD</react_native_1.Text>

        <react_native_1.Text style={styles.label}>{t('fx.receiveRate')}</react_native_1.Text>
        <react_native_1.Text style={styles.value}>855 ARS/USD</react_native_1.Text>

        <react_native_1.Text style={styles.label}>{t('fx.spread')}</react_native_1.Text>
        <react_native_1.Text style={styles.value}>±0.6%</react_native_1.Text>
      </react_native_1.View>

      <react_native_1.Text style={styles.footer}>{t('fx.footer')}</react_native_1.Text>
    </react_native_1.View>);
};
exports.OnboardingFXScreen = OnboardingFXScreen;
var styles = react_native_1.StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    body: { fontSize: 14, marginBottom: 16 },
    box: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8 },
    label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
    value: { fontSize: 14, color: '#333' },
    footer: { fontSize: 14, marginTop: 16, color: '#555' }
});
