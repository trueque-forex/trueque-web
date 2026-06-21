import React, { createContext, useContext, useState, useEffect } from 'react';

export type MarketOrigin = 'US' | 'ES';
export type DestRegion = 'MX' | 'CO' | 'GT' | 'DO';

interface MarketContextProps {
  originMarket: MarketOrigin;
  destRegion: DestRegion;
  setOriginMarket: (market: MarketOrigin) => void;
  setDestRegion: (region: DestRegion) => void;
}

const MarketContext = createContext<MarketContextProps | undefined>(undefined);

export function MarketProvider({ children, initialMarket = 'US', initialDest = 'MX' }: { children: React.ReactNode, initialMarket?: MarketOrigin, initialDest?: DestRegion }) {
  const [originMarket, setOriginMarketState] = useState<MarketOrigin>(initialMarket);
  const [destRegion, setDestRegionState] = useState<DestRegion>(initialDest);

  useEffect(() => {
    // Delete legacy cookies
    document.cookie = 'trueque_market_origin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'trueque_market=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    // Client-side hydration
    const marketMatch = document.cookie.match(new RegExp('(^| )symmetri_market=([^;]+)'));
    if (marketMatch) {
      const cookieMarket = marketMatch[2] as MarketOrigin;
      if (cookieMarket === 'US' || cookieMarket === 'ES') {
        setOriginMarketState(cookieMarket);
      }
    }

    const destMatch = document.cookie.match(new RegExp('(^| )symmetri_dest=([^;]+)'));
    if (destMatch) {
      const cookieDest = destMatch[2] as DestRegion;
      if (['MX', 'CO', 'GT', 'DO'].includes(cookieDest)) {
        setDestRegionState(cookieDest);
      }
    }
  }, []);

  const setOriginMarket = (market: MarketOrigin) => {
    setOriginMarketState(market);
    document.cookie = `symmetri_market=${market}; path=/; max-age=31536000`;
  };

  const setDestRegion = (region: DestRegion) => {
    setDestRegionState(region);
    document.cookie = `symmetri_dest=${region}; path=/; max-age=31536000`;
  };

  return (
    <MarketContext.Provider value={{ originMarket, destRegion, setOriginMarket, setDestRegion }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
