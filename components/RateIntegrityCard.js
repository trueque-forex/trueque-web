import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
export const RateIntegrityCard = ({ fx_rate_market, user_rate, effective_rate, fee_breakdown, userRole }) => {
    const { t } = useTranslation();
    return (_jsxs(View, { style: styles.card, children: [_jsxs(Text, { style: styles.title, children: ["\uD83D\uDCCA ", t('fx.title')] }), _jsxs(Text, { style: styles.label, children: [t('fx.marketRate'), ":"] }), _jsx(Text, { style: styles.value, children: fx_rate_market }), _jsxs(Text, { style: styles.label, children: [userRole === 'sender' ? t('fx.sendRate') : t('fx.receiveRate'), ":"] }), _jsx(Text, { style: styles.value, children: user_rate }), _jsxs(Text, { style: styles.label, children: [t('fx.effectiveRate'), ":"] }), _jsx(Text, { style: styles.value, children: effective_rate }), _jsxs(Text, { style: styles.label, children: [t('fee.title'), ":"] }), _jsxs(Text, { style: styles.value, children: [t('fee.trueque'), ": ", fee_breakdown.trueque_fee, "%", '\n', t('fee.transmitter'), ": ", fee_breakdown.transmitter_fee, "%", '\n', t('fee.delivery'), ": ", fee_breakdown.delivery_premium, "%", '\n', t('fee.total'), ": ", fee_breakdown.total, "%"] }), _jsxs(Text, { style: styles.label, children: [t('fee.deliveryChoice'), ":"] }), _jsxs(Text, { style: styles.value, children: [fee_breakdown.delivery_choice === 'instant' && t('delivery.instant'), fee_breakdown.delivery_choice === 'same_day' && t('delivery.sameDay'), fee_breakdown.delivery_choice === 'next_day' && t('delivery.nextDay'), fee_breakdown.delivery_choice === 'batch' && t('delivery.batch')] }), _jsx(Text, { style: styles.footer, children: t('fx.footer') })] }));
};
const styles = StyleSheet.create({
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
