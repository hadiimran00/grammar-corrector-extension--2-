// api/grammar.js
// Vercel serverless function that proxies to Google's Gemini API.
// Keep your API key safe by storing GEMINI_API_KEY in Vercel → Project Settings → Environment Variables.
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const prompt = `You are a grammar and formatting engine.
Your only job is to take the input text and:
- Fix grammar, spelling, punctuation.
- Improve clarity while keeping the meaning unchanged.
- Apply proper formatting (capitalization, paragraph breaks, bullet points if needed).
- Preserve tone and intent.
If it's already correct, return it exactly as is.
Rules:
- No explanations, no comments, no meta.
- Output only the corrected text.

Text:
${text}`;

    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await resp.json();
    const fixed = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    return res.status(200).json({ corrected: fixed });
  } catch (err) {
    console.error("Gemini proxy error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
