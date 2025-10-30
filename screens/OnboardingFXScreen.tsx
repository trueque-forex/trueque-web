import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export const OnboardingFXScreen = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fx.title')}</Text>
      <Text style={styles.body}>{t('fx.body')}</Text>

      <View style={styles.box}>
        <Text style={styles.label}>{t('fx.marketRate')}</Text>
        <Text style={styles.value}>850 ARS/USD</Text>

        <Text style={styles.label}>{t('fx.sendRate')}</Text>
        <Text style={styles.value}>845 ARS/USD</Text>

        <Text style={styles.label}>{t('fx.receiveRate')}</Text>
        <Text style={styles.value}>855 ARS/USD</Text>

        <Text style={styles.label}>{t('fx.spread')}</Text>
        <Text style={styles.value}>±0.6%</Text>
      </View>

      <Text style={styles.footer}>{t('fx.footer')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  body: { fontSize: 14, marginBottom: 16 },
  box: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  value: { fontSize: 14, color: '#333' },
  footer: { fontSize: 14, marginTop: 16, color: '#555' }
<<<<<<< HEAD
});
=======
});
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
