// trueque-web/api/audit.ts

export default function handler(req, res) {
  const { corridor } = req.query;

  res.status(200).json({
    message: "Audit logs fetched successfully",
    corridor: corridor || "unspecified",
    logs: [
      { timestamp: Date.now(), status: "ok", corridor },
      { timestamp: Date.now(), status: "acknowledged", corridor }
    ]
  });
}