import { useState } from 'react';

export default function UnifiedSenderDashboard() {
  const [dashboard, setDashboard] = useState({});
  return <div>{JSON.stringify(dashboard)}</div>;
}
