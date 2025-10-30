import React, { useEffect, useState } from 'react';

export default function PingTestPage(): React.JSX.Element {
  const [output, setOutput] = useState<string>('Running ping test…');

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const res = await fetch('/api/ping');
        const data = (await res.json()) as { status?: string; message?: string } | unknown;

        if (!mounted) return;

        if (res.ok && (data as any)?.status === 'ok') {
          setOutput(`API test passed: ${(data as any).message ?? 'ok'}`);
        } else {
          setOutput(`API test failed: ${JSON.stringify(data ?? { status: res.status, statusText: res.statusText })}`);
        }
      } catch (err: any) {
        if (!mounted) return;
        setOutput(`API test error: ${err?.message ?? String(err)}`);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <h1>Ping test</h1>
      <pre>{output}</pre>
    </main>
  );
}