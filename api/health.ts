// trueque-web/api/health.ts

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    location: 'Redlands, CA',
    timestamp: Date.now(),
  });
}