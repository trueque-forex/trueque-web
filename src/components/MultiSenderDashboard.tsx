import { useState } from 'react';

export default function MultiSenderDashboard() {
  const [senders, setSenders] = useState([]);
  return <div>{senders.length} senders</div>;
}
