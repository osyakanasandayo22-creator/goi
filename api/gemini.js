export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not set on server" });
  }

  const { prompt, modelName = "gemini-3-flash-preview" } = req.body || {};

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt is required" });
  }

  try {
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/" +
      encodeURIComponent(modelName) +
      ":generateContent?key=" +
      encodeURIComponent(apiKey);

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const upstreamRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return res.status(upstreamRes.status).json({
        error: "Gemini API error",
        status: upstreamRes.status,
        body: errText,
      });
    }

    const data = await upstreamRes.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      data.candidates?.[0]?.content?.parts?.[0]?.inlineData ??
      "";

    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}

