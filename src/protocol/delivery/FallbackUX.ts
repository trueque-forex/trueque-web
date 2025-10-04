import { FeeAttribution } from '../fees/FeeAttribution';

export type FallbackMessage = {
  senderId: string;
  corridorId: string;
  deliverySpeed: string;
  fallbackTriggered: boolean;
  message: string;
  tone: 'reassuring' | 'neutral' | 'urgent';
};

export function generateFallbackMessage(fee: FeeAttribution): FallbackMessage {
  if (!fee.fallbackTriggered) {
    return {
      senderId: fee.senderId,
      corridorId: fee.corridorId,
      deliverySpeed: fee.deliverySpeed,
      fallbackTriggered: false,
      message: 'Delivery is proceeding as expected.',
      tone: 'neutral'
    };
  }

  const tone = fee.deliverySpeed === 'instant' ? 'reassuring' : 'urgent';
  const message =
    tone === 'reassuring'
      ? 'Delivery is taking slightly longer than expected. Your funds are safe and will arrive shortly.'
      : 'Delivery delay detected. We’re actively resolving it and will notify you once completed.';

  return {
    senderId: fee.senderId,
    corridorId: fee.corridorId,
    deliverySpeed: fee.deliverySpeed,
    fallbackTriggered: true,
    message,
    tone
  };
}