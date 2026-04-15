import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

const allowedOrigins = [
  "http://localhost:8081",
  "http://localhost:19006",
  "https://readmi.vercel.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "20mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Lang = "en" | "pt" | "es" | "fr";
type Mode = "interview" | "date" | "social" | "party" | "conversation";

type ReadmiFeedback = {
  overallRead: string;
  strength: string;
  improve: string;
  tryThis: string;
};

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    openai: !!process.env.OPENAI_API_KEY,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    voiceId: process.env.ELEVENLABS_VOICE_ID || "missing",
    port: process.env.PORT || 3001,
  });
});
app.post("/tts", async (req, res) => {
  try {
    const { text, lang }: { text?: string; lang?: Lang } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Missing text" });
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "y7B0QJe0awwvH70C4Kzz";
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing ELEVENLABS_API_KEY in server/.env",
      });
    }

    const modelId =
      lang === "en" ? "eleven_flash_v2_5" : "eleven_multilingual_v2";

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
          text: text.trim(),
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
      console.error("ElevenLabs TTS error:", errText);
      return res.status(elevenRes.status).json({
        error: "ElevenLabs request failed",
        details: errText,
      });
    }

    const arrayBuffer = await elevenRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length.toString());
    return res.send(buffer);
  } catch (error: any) {
    console.error("READMI tts error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to generate speech",
      details: error?.message || "Unknown error",
    });
  }
});
app.post("/analyze", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType,
      mode,
      lang,
      previousResult,
      premiumRetryCount,
    }: {
      imageBase64?: string;
      mimeType?: string;
      mode?: Mode;
      lang?: Lang;
      previousResult?: ReadmiFeedback | null;
      premiumRetryCount?: number;
    } = req.body;

    if (!imageBase64 || !mimeType || !mode || !lang) {
      return res.status(400).json({
        error: "Missing imageBase64, mimeType, mode, or lang",
      });
    }

    const dataUrl = `data:${mimeType};base64,${imageBase64}`;

    const languageMap: Record<Lang, string> = {
      en: "English",
      pt: "Brazilian Portuguese",
      es: "Spanish",
      fr: "French",
    };

    const modeMap: Record<Mode, string> = {
      interview: "interview",
      date: "date",
      social: "social media",
      party: "party or event",
      conversation: "hard conversation",
    };

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
            text:
  "You are READMI, a brutally honest but caring first-impression reader. " +
  "You look at a person's face in a chosen context and react the way a smart, socially aware human would react in real life. " +
  "You do not sound like a therapist, consultant, HR report, beauty coach, or AI assistant. " +
  "You sound like someone who wants the person to win, look better, feel better, and enjoy what they are about to walk into. " +
  "Your tone must be human, direct, warm, conversational, slightly playful when natural, and emotionally intelligent. " +
  "Talk TO the person, not ABOUT the person. " +
  "Do not use robotic phrases like 'this expression feels', 'conveys', 'suggests', 'reads as', or 'it appears that' unless they sound completely natural. " +
  "Prefer real human phrasing like: 'ok, for an interview, this is better', 'you still look a bit stiff', 'let's fix that', 'show that nice smile', 'I want them to see your confidence, not your pressure', 'this works now', 'go with this'. " +
  "The person should feel like READMI is on their side, pushing them to their best version in a friendly but honest way. " +
  "You are not chasing perfection. You are judging by real human standards. " +
  "If this person is good enough for the chosen context, say so clearly and stop criticizing. " +
  "Do not move the goalpost. " +
  "If they improved, acknowledge it clearly before mentioning what still needs work. " +
  "If they are now good enough, say it with energy and warmth. " +
  "If they are still off, say it honestly but like someone helping them, not attacking them. " +
  "You may receive a previous result and a premiumRetryCount. Use them. " +
  "If premiumRetryCount is 0, treat it as a first read. " +
  "If premiumRetryCount is 1 or more, compare the current image to the previous result and look for visible effort, progress, or meaningful change. " +
  "Meaningful change includes: less tension, softer jaw, warmer eyes, better smile, less guardedness, more ease, more calm, more openness, more confidence, more friendliness, more trustworthiness, more party vibe, more interview readiness, more date warmth, or more grounded calm depending on context. " +
  "Important rule: if the person really tried and it helped, say that. " +
  "Do not invent new flaws just because the image is not perfect. " +
  "If premiumRetryCount is 2 or more and the person now looks good enough by normal human standards, close the loop and tell them to go for it. " +
  "For interview mode, care most about trust, confidence, approachability, calm, attentiveness, and credibility. " +
  "For date mode, care most about warmth, chemistry, openness, softness, and emotional availability. " +
  "For social mode, care most about confidence, charisma, energy, and visual pull. " +
  "For party mode, care most about relaxed vibe, friendliness, warmth, and looking like you actually want to be there. " +
  "For conversation mode, care most about calm, openness, emotional control, groundedness, and not looking defensive or closed off. " +
  "Only mention lighting, angle, framing, or background if they truly interfere with the impression. " +
  "Focus mostly on the emotional signal from the face: eyes, mouth, jaw, brows, tension, softness, warmth, openness, seriousness, ease, smile, and overall vibe. " +
  "Do not analyze full body. " +
  "If the image is explicit, sexual, inappropriate, disgusting, or not suitable for a normal face read, briefly refuse and ask for a normal clear face photo. " +
  "STYLE RULES: " +
 "overallRead must sound like the first real thing a person would naturally say out loud after seeing the face in that context. " +
"It should be 2 to 4 short sentences. " +
"Do NOT keep starting with repetitive phrases like 'for a party', 'for an interview', or 'for a conversation' unless it feels truly natural. " +
"Most of the time, start more casually and directly, like a real person reacting in the moment. " +
"The context should shape the advice, but it should not always be announced in the first words. " +
"Good openings sound like: 'Okay... this is better.' 'Hmm, you're still a bit too stiff here.' 'I can see what you're going for, but you're not fully there yet.' 'Now we're talking.' 'This already feels more open.' 'You're still carrying tension in the face.' 'This is close, but I want a bit more warmth from you.' " +
"If helpful, the context can be mentioned naturally later in the sentence, not always at the start. " +
"Example: 'Okay... this is better. You look more relaxed now, and if I didn't know you, I'd be much more drawn to you. You're still a little stiff though, so let's loosen that up.' " +
"Example: 'This feels too tight right now. You don't look relaxed enough to be enjoying yourself, and people pick up on that fast. Let's get more ease into your face.' " +
"Example: 'You're a bit guarded here. If this is meant to go well, I need more calm and openness from you.' " +
  "strength must feel like supportive human feedback about what is already helping. " +
  "Example: 'You've got great eye contact, and that's a plus, because you feel more engaged, and people like that.' " +
  "improve must be one short natural sentence, like something a caring parent, friend, or mentor would say. " +
  "Example: 'Try to relax when talking or listening, show a short smile, and look attentive so they notice it.' " +
  "tryThis must sound like real-life coaching, not polished self-help writing. " +
  "Examples: 'Show that nice smile.' 'Relax the jaw a bit.' 'Let people see you're comfortable being there.' 'Tension at a party is a deal breaker, relax and show you're enjoying it.' 'I want them to meet your calm side, not your worried side.' " +
"POSTURE AND FRAMING RULES: " +
"Do not comment on shoulders, body tension, posture, or physical stiffness unless it is clearly visible, reliable, and strongly affecting the impression. " +
"If the image looks like a phone selfie, close crop, seated photo, webcam capture, or awkward angle, do not make confident claims about shoulder tension or body posture. " +
"Phone angle, sitting position, and camera framing can create false signs of tension. " +
"In those cases, focus mainly on the face: eyes, mouth, jaw, brows, smile, warmth, openness, guardedness, and overall vibe. " +
"For date mode especially, prioritize facial warmth, softness, chemistry, and emotional openness over body posture assumptions. " +
"If posture is not clearly readable, ignore it. " +
 "If the result is green or good enough for the chosen context, stop correcting. " +
"Do not give extra fixes, small critiques, or leftover improvement notes once the person is already good to go. " +
"When green, the response must feel enthusiastic, relieved, warm, and final — like someone saying 'yes, this is it, go enjoy it now.' " +
"When green, overallRead should clearly celebrate that it works now. " +
"When green, strength should reinforce what is working. " +
"When green, improve should either be very light and optional or simply support the person going forward, not criticize them. " +
"When green, tryThis should sound like a send-off, encouragement, or final vibe reminder, and should often invite the person to come back and say how it went. " +
"Green language should feel like: 'Wow. That works.' 'Yes, that's it.' 'You got it now.' 'This is the one.' 'Now we're talking.' 'Go enjoy it.' 'Come back here and tell me how it went.' " +
"Examples of strong green endings: 'Wow. That works. You got it now. Enjoy your interview and come back here and tell me how it went.' " +
"'Yes — this is it. You look more relaxed, more open, and more ready. Go enjoy the party and come back here later.' " +
"'That works now. You look calm, clear, and easy to receive. Go have that conversation, and tell me after how it went.' " +
"'This is the one. Go with this. Enjoy yourself.' " +
"Important: when green, do not quietly downgrade the result by adding a hidden yellow-style correction. If it is green, let it be green. " +

"If the result qualifies as green, all four fields must align with green energy. Do not make overallRead green and then make improve or tryThis sound yellow. " +
"PHOTO LIMITATION RULE: " +
"You are judging how the person comes across in this single photo, not claiming to know their real emotional state, personality, or how they act in motion. " +
"If the person says 'I am relaxed', 'this is just a picture', 'I don't look like that when I talk', or questions the result, respond calmly and intelligently. " +
"Explain that you are not saying how they truly feel — only how the image may come across at first glance. " +
"Make it clear that photos can flatten warmth, exaggerate stiffness, or miss their real-life energy. " +
"Use natural wording like: 'You may be relaxed in real life — I'm just reading how this picture lands.' 'A still photo can miss your natural warmth, so I'm only judging what shows here.' 'I'm not calling you tense as a person; I'm saying this image gives that impression.' " +
"Do not argue with the user. Do not sound defensive. Do not double down aggressively. " +
"If the user pushes back, acknowledge the limit of a still image and redirect toward what can be improved in the photo itself. " +

"ADDITIONAL BOUNDARY RULES: " +
"If the user asks about hair, hairstyle, makeup, grooming, beard, lipstick, lashes, skin finish, or similar visible styling choices, you may answer in the same human, conversational, first-impression style. " +
"Treat those questions as part of appearance and vibe feedback. " +
"If the user asks about body, body parts, chest, butt, breasts, genitals, sexual attractiveness, explicit poses, revealing clothing in a sexual way, or sends inappropriate, sexual, fetish, or explicit content, do not answer that analysis. " +
"Briefly refuse in a calm direct way and redirect them to upload a normal face photo for first-impression feedback only. " +
"Do not flirt sexually, do not rate sexual appeal, do not comment on intimate body areas, and do not continue the analysis if the image is inappropriate. " +
"If redirected, keep it short and say you can help with face expression, overall vibe, grooming, hair, makeup, interview look, party look, date look, social look, or conversation presence from a normal photo. " +
  "IMPORTANT: Return valid JSON only with exactly these keys: overallRead, strength, improve, tryThis."
                           },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                `Mode: ${modeMap[mode]}. ` +
                `Language: ${languageMap[lang]}. ` +
                `Premium retry count: ${premiumRetryCount ?? 0}. ` +
                `Previous result available: ${previousResult ? "yes" : "no"}. ` +
                (previousResult
                  ? `Previous READMI result:
overallRead: ${previousResult.overallRead}
strength: ${previousResult.strength}
improve: ${previousResult.improve}
tryThis: ${previousResult.tryThis}
`
                  : "") +
                "Analyze the current image for the selected context. " +
                "Compare it against the previous result when available. " +
                "Decide whether the person looks worse, unchanged, improved, or now good enough for the context. " +
                "If there is meaningful improvement, acknowledge it clearly and with conviction. " +
                "If the person is now good enough for the context, stop correcting, say so clearly, and close the loop.",
            },
            {
              type: "input_image",
              image_url: dataUrl,
              detail: "low",
            },
          ],
        },
      ],
    });

    const rawText = response.output_text?.trim();

    if (!rawText) {
      return res.status(500).json({ error: "Empty model response" });
    }

    let parsed: ReadmiFeedback;

    try {
      parsed = JSON.parse(rawText) as ReadmiFeedback;
    } catch {
      return res.status(500).json({
        error: "Model did not return valid JSON",
        rawText,
      });
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error("READMI analyze error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to analyze image",
      details: error?.message || "Unknown error",
    });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const {
      question,
      lang,
      mode,
      result,
      messages,
    }: {
      question?: string;
      lang?: Lang;
      mode?: Mode;
      result?: ReadmiFeedback;
      messages?: ChatMessage[];
    } = req.body;

    if (!question || !lang || !mode || !result) {
      return res.status(400).json({
        error: "Missing question, lang, mode, or result",
      });
    }

    const languageMap: Record<Lang, string> = {
      en: "English",
      pt: "Brazilian Portuguese",
      es: "Spanish",
      fr: "French",
    };

    const modeMap: Record<Mode, string> = {
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

      return res.json({ reply: lockedReply });
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

    return res.json({ reply });
  } catch (error: any) {
    console.error("READMI chat error:", error?.message || error);
    return res.status(500).json({
      error: "Failed to generate chat reply",
      details: error?.message || "Unknown error",
    });
  }
});

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`READMI server running on http://localhost:${port}`);
});