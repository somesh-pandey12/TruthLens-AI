
import "dotenv/config";
import express from "express";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());

const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("API key loaded:", apiKey ? "YES" : "NO"); 

const client = apiKey ? new Anthropic({ apiKey }) : null;

app.post("/api/analyze", async (req, res) => {
  const { content, sourceLink } = req.body;

  if (!client) {
    return res.status(503).json({
      error: "NOT_CONFIGURED",
      message: "ANTHROPIC_API_KEY server pe set nahi hai",
    });
  }

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 1000,
      system: `You are a fact-checking assistant. Respond ONLY with valid JSON:
{"verdict":"True|False|Misleading|Unverified","score":0-100,"confidence":0-100,"red_flags":["..."],"explanation":"..."}`,
      messages: [
        { role: "user", content: `Claim: ${content}\nSource: ${sourceLink || "none"}` },
      ],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text.replace(/```json|```/g, "").trim();
    res.json(JSON.parse(clean));
  } catch (err) {
    console.error("AI error:", err.status, err.message); 
    res.status(502).json({ error: "AI_FAILED", message: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Server running"));