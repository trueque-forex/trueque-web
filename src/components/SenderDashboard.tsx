import { useState } from 'react';

export default function SenderDashboard() {
  const [senderData, setSenderData] = useState(null);
  return <div>{senderData}</div>;
}
