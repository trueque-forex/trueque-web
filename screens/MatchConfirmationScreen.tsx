<<<<<<< HEAD
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
=======
﻿import React, { useEffect, useState } from 'react';
import RateIntegrityCard from '@/components/RateIntegrityCard';
import RateIntegrityCardSimple from '@/components/RateIntegrityCardSimple';
import { useTranslation } from 'react-i18next';
import fetchRateIntegrity from '@/lib/services/match';

type FeeBreakdown = {
  trueque_fee?: number;
  transmitter_fee?: number;
  delivery_premium?: number;
  total?: number;
  country_model?: string;
  delivery_choice?: string;
};

type IntegrityData = {
  fx_rate_market?: number;
  bid_rate?: number;
  ask_rate?: number;
  effective_rate_user_A?: number;
  effective_rate_user_B?: number;
  trueque_fee_A?: number;
  trueque_fee_B?: number;
  transmitter_fee_A?: number;
  transmitter_fee_B?: number;
  delivery_premium_A?: number;
  delivery_premium_B?: number;
  total_fee_A?: number;
  total_fee_B?: number;
  country_model_A?: string;
  country_model_B?: string;
  delivery_choice_A?: string;
  delivery_choice_B?: string;
};

type MatchConfirmationScreenProps = {
  route: {
    params: {
      matchId: string;
      userRole: 'sender' | 'receiver';
      userProfile: { literacyLevel?: string; isFirstTime?: boolean };
    };
  };
};

export const MatchConfirmationScreen: React.FC<MatchConfirmationScreenProps> = ({ route }) => {
  const { matchId, userRole, userProfile } = route.params;
  const { t } = useTranslation();

  const [integrityData, setIntegrityData] = useState<IntegrityData | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>(
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
    userProfile.literacyLevel === 'low' || userProfile.isFirstTime ? 'simple' : 'detailed'
  );

  useEffect(() => {
<<<<<<< HEAD
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
=======
    let mounted = true;
    async function loadIntegrity() {
      try {
        const data = await fetchRateIntegrity(matchId);
        if (mounted) setIntegrityData(data);
      } catch (err) {
        console.error('Failed to load integrity data', err);
      }
    }
    loadIntegrity();
    return () => {
      mounted = false;
    };
  }, [matchId]);

  if (!integrityData) return <div>Loading…</div>;

  const view =
    userRole === 'sender'
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
            delivery_choice: integrityData.delivery_choice_A,
          } as FeeBreakdown,
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
            delivery_choice: integrityData.delivery_choice_B,
          } as FeeBreakdown,
        };

  return (
    <div style={{ padding: 16 }}>
      <h2>✓ {t('match.confirmed')}</h2>
      <p style={{ margin: '8px 0' }}>{t('match.message')}</p>

      <button
        onClick={() => setViewMode(viewMode === 'detailed' ? 'simple' : 'detailed')}
        style={{ marginBottom: 12 }}
      >
        {viewMode === 'detailed' ? t('match.simplify') : t('match.details')}
      </button>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)

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
<<<<<<< HEAD
    </View>
=======
    </div>
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
  );
};