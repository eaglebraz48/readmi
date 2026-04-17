module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST" && req.method !== "GET") {
  return res.status(405).json({ error: "Method not allowed" });
}

  try {
    const text =
  req.method === "GET"
    ? req.query?.text
    : req.body?.text;

const lang =
  req.method === "GET"
    ? req.query?.lang
    : req.body?.lang;

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: "Missing text" });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "y7B0QJe0awwvH70C4Kzz";
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing ELEVENLABS_API_KEY" });
    }

    const modelId = lang === "en" ? "eleven_flash_v2_5" : "eleven_multilingual_v2";

    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: String(text).trim(),
          model_id: modelId,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      return res.status(elevenRes.status).json({
        error: "ElevenLabs request failed",
        details: errText,
      });
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length.toString());
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate speech",
      details: error?.message || "Unknown error",
    });
  }
};