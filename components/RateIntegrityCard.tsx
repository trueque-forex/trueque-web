import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export const RateIntegrityCard = ({
  fx_rate_market,
  user_rate,
  effective_rate,
  fee_breakdown,
  userRole
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📊 {t('fx.title')}</Text>

      <Text style={styles.label}>{t('fx.marketRate')}:</Text>
      <Text style={styles.value}>{fx_rate_market}</Text>

      <Text style={styles.label}>
        {userRole === 'sender' ? t('fx.sendRate') : t('fx.receiveRate')}:
      </Text>
      <Text style={styles.value}>{user_rate}</Text>

      <Text style={styles.label}>{t('fx.effectiveRate')}:</Text>
      <Text style={styles.value}>{effective_rate}</Text>

      <Text style={styles.label}>{t('fee.title')}:</Text>
      <Text style={styles.value}>
        {t('fee.trueque')}: {fee_breakdown.trueque_fee}%{'\n'}
        {t('fee.transmitter')}: {fee_breakdown.transmitter_fee}%{'\n'}
        {t('fee.delivery')}: {fee_breakdown.delivery_premium}%{'\n'}
        {t('fee.total')}: {fee_breakdown.total}%
      </Text>

      <Text style={styles.label}>{t('fee.deliveryChoice')}:</Text>
      <Text style={styles.value}>
        {fee_breakdown.delivery_choice === 'instant' && t('delivery.instant')}
        {fee_breakdown.delivery_choice === 'same_day' && t('delivery.sameDay')}
        {fee_breakdown.delivery_choice === 'next_day' && t('delivery.nextDay')}
        {fee_breakdown.delivery_choice === 'batch' && t('delivery.batch')}
      </Text>

      <Text style={styles.footer}>{t('fx.footer')}</Text>
    </View>
  );
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