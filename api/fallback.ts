// trueque-web/api/fallback.ts

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reason, userId, corridor } = req.body;

  res.status(200).json({
    message: "Fallback acknowledged",
    reason,
    userId,
    corridor,
    timestamp: Date.now()
  });
}