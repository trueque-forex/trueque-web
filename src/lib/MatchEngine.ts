// src/lib/MatchEngine.ts

import { transmitters } from './TransmitterRegistry';

export function validateTransmitter(country: string, model: 'OM' | 'TBM') {
  const tx = transmitters.find(t => t.country === country && t.supportsModel.includes(model));
  if (!tx || !tx.kycCompliant) {
    throw new Error(`No compliant transmitter found for ${country} under ${model} model.`);
  }
  return tx;
}

export function executeMatch(match: {
  corridor: string;
  senderCountry: string;
  receiverCountry: string;
  model: 'OM' | 'TBM';
}) {
  const senderTx = validateTransmitter(match.senderCountry, match.model);
  const receiverTx = validateTransmitter(match.receiverCountry, match.model);

  return {
    status: 'ready',
    senderTransmitter: senderTx.name,
    receiverTransmitter: receiverTx.name,
    corridor: match.corridor,
    model: match.model
  };
}
