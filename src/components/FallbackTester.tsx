import { useState } from 'react';

export default function FallbackTester() {
  const [result, setResult] = useState(null);
  return <div>{result}</div>;
}
