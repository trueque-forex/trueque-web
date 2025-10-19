import { useState } from 'react';

export default function FallbackUXDemo() {
  const [triggered, setTriggered] = useState(false);
  return <div>{triggered ? 'Fallback active' : 'Normal flow'}</div>;
}
