export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const fetch = require("node-fetch");
  const response = await fetch("http://localhost:8008/generate-question", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: req.body,
  });
  const data = await response.json();
  res.status(response.status).json(data);
} 