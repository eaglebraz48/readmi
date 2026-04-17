const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, lang, mode, result, messages } = req.body || {};

    if (!question || !lang || !mode || !result) {
      return res.status(400).json({
        error: "Missing question, lang, mode, or result",
      });
    }

    const languageMap = {
      en: "English",
      pt: "Brazilian Portuguese",
      es: "Spanish",
      fr: "French",
    };

    const modeMap = {
      interview: "interview",
      date: "date",
      social: "social media",
      party: "party or event",
      conversation: "hard conversation",
    };

    const safeMessages = Array.isArray(messages) ? messages : [];
    const turnNumber = Math.floor(safeMessages.length / 2) + 1;

    if (turnNumber >= 3) {
      const lockedReply =
        lang === "pt"
          ? "Você já está bom para esse contexto. Eu iria com essa versão. Não mexe mais."
          : lang === "es"
          ? "Ya te ves bien para este contexto. Yo iría con esta versión. No la sigas ajustando."
          : lang === "fr"
          ? "Vous êtes déjà bien pour ce contexte. J’irais avec cette version. N’ajustez plus."
          : "You already look good for this context. I would go with this version. Do not keep adjusting.";

      return res.status(200).json({ reply: lockedReply });
    }

    const historyText = safeMessages.length
      ? safeMessages
          .map((m) => `${m.role === "bot" ? "Assistant" : "User"}: ${m.text}`)
          .join("\n")
      : "";

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are READMI Plus, a human-like appearance and presence coach. " +
                "Speak like a real person, not an assistant. Be natural, direct, observant, and socially realistic. " +
                "You give one focused read per turn. You never give lists. You never pile on fixes. " +
                `You are on turn ${turnNumber} of this conversation. ` +
                "TURN 1: Start with a human reaction. Give one sharp observation based on the READMI result. Then give exactly one thing to try. End there. " +
                "TURN 2: Compare what the user said to the previous read. Say what improved or what shifted. Acknowledge improvement clearly if it is there. Give one final adjustment only if truly needed. Stay positive and direct. " +
                "TURN 3 AND BEYOND: The user is done. Say the result is good enough for this context. Do not add new fixes. Do not hedge. Close it clearly. " +
                "Never repeat advice already given. Never stack multiple suggestions. Never say 'also' or 'additionally'. " +
                "If the user looks better, say so with conviction. If they are ready, say so clearly. " +
                "Adapt to the selected context: interview, date, social media, party or event, or hard conversation. " +
                "Focus only on visible presentation, first impression, expression, tension, openness, warmth, and presence. Do not analyze full body. " +
                "Do not comment on shoulders, posture, body tension, or body positioning unless they are very clearly visible and unquestionably important. In most selfies and still photos, ignore shoulders completely. Focus on the face, expression, eyes, mouth, jaw, brows, warmth, openness, and first impression. " +
                "If the result is already green, good enough, ready, or clearly improved enough for the context, stop correcting. " +
                "When the result is green or clearly good enough, you must close with encouragement and a return hook. " +
                "That means you should naturally say things like: 'go enjoy it', 'you got it now', 'have a great interview', 'enjoy the party', 'go have that conversation', and invite them to come back and say how it went. " +
                "Examples of good green closings: 'Wow, that works. You got it now. Enjoy your interview and come back here and tell me how it went.' 'Yes, this is it. Go enjoy the party and come back later if you want another read.' 'That works now. Go have the conversation and tell me after how it went.' " +
                "If the user asks if they are ready, and the result is green or clearly good enough, answer yes clearly and warmly, then send them off and invite them back. " +
                "Do not weaken a green result by adding a new hidden correction. " +
                "If the user expresses strong satisfaction, invite them once to leave a review on Google Play or the App Store. Never repeat it. " +
                "Do not engage with sexual, explicit, or inappropriate content. " +
                "Do not return JSON. Return plain text only.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `Language: ${languageMap[lang]}\n` +
                `Mode: ${modeMap[mode]}\n\n` +
                `Current READMI result:\n` +
                `overallRead: ${result.overallRead}\n` +
                `strength: ${result.strength}\n` +
                `improve: ${result.improve}\n` +
                `tryThis: ${result.tryThis}\n\n` +
                `Conversation so far:\n${historyText || "None"}\n\n` +
                `User question: ${question}`,
            },
          ],
        },
      ],
    });

    const reply = response.output_text?.trim();

    if (!reply) {
      return res.status(500).json({ error: "Empty model response" });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate chat reply",
      details: error?.message || "Unknown error",
    });
  }
};