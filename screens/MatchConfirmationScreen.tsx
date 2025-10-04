import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fetchRateIntegrity } from '../lib/services/match';
import { RateIntegrityCard } from '../components/RateIntegrityCard';
import { RateIntegrityCardSimple } from '../components/RateIntegrityCardSimple';

export const MatchConfirmationScreen = ({ route }) => {
  const { matchId, userRole, userProfile } = route.params; // 'sender' or 'receiver'
  const { t } = useTranslation();

  const [integrityData, setIntegrityData] = useState(null);
  const [viewMode, setViewMode] = useState(
    userProfile.literacyLevel === 'low' || userProfile.isFirstTime ? 'simple' : 'detailed'
  );

  useEffect(() => {
    async function loadIntegrity() {
      const data = await fetchRateIntegrity(matchId);
      setIntegrityData(data);
    }
    loadIntegrity();
  }, [matchId]);

  if (!integrityData) return <ActivityIndicator />;

  const view = userRole === 'sender'
    ? {
        fx_rate_market: integrityData.fx_rate_market,
        rate: integrityData.bid_rate,
        effective_rate: integrityData.effective_rate_user_A,
        fee_breakdown: {
          trueque_fee: integrityData.trueque_fee_A,
          transmitter_fee: integrityData.transmitter_fee_A,
          delivery_premium: integrityData.delivery_premium_A,
          total: integrityData.total_fee_A,
          country_model: integrityData.country_model_A,
          delivery_choice: integrityData.delivery_choice_A
        }
      }
    : {
        fx_rate_market: integrityData.fx_rate_market,
        rate: integrityData.ask_rate,
        effective_rate: integrityData.effective_rate_user_B,
        fee_breakdown: {
          trueque_fee: integrityData.trueque_fee_B,
          transmitter_fee: integrityData.transmitter_fee_B,
          delivery_premium: integrityData.delivery_premium_B,
          total: integrityData.total_fee_B,
          country_model: integrityData.country_model_B,
          delivery_choice: integrityData.delivery_choice_B
        }
      };

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>✅ {t('match.confirmed')}</Text>
      <Text style={{ marginVertical: 8 }}>
        {t('match.message')}
      </Text>

      <Button
        title={viewMode === 'detailed' ? t('match.simplify') : t('match.details')}
        onPress={() => setViewMode(viewMode === 'detailed' ? 'simple' : 'detailed')}
      />

      {viewMode === 'simple' ? (
        <RateIntegrityCardSimple
          fx_rate_market={view.fx_rate_market}
          user_rate={view.rate}
          fee_total={view.fee_breakdown.total}
          userRole={userRole}
        />
      ) : (
        <RateIntegrityCard
          fx_rate_market={view.fx_rate_market}
          user_rate={view.rate}
          effective_rate={view.effective_rate}
          fee_breakdown={view.fee_breakdown}
          userRole={userRole}
        />
      )}
    </View>
  );
};