import { useState } from 'react';

export default function RecipientOnboarding() {
  const [step, setStep] = useState(1);
  return <div>Step {step}</div>;
}
