import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

// Lazy-initialize Gemini client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // AI sentiment analysis API
  app.post("/api/ai/sentiment", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'text' field" });
      }

      const ai = getAiClient();
      const prompt = `Analyze the sentiment of the following political/civic discussion or post from India. Categorize the sentiment into "Positive", "Negative", or "Neutral". Return a JSON object with keys "sentiment" (value must be "Positive", "Negative", or "Neutral"), "confidence" (float between 0 and 1), and "rationale" (a concise, 1-2 sentence explanation of why this sentiment was chosen).
      
  Text to analyze:
  "${text}"

  Response JSON format:
  {
    "sentiment": "Positive" | "Negative" | "Neutral",
    "confidence": number,
    "rationale": "string"
  }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini");
      }
      const resultJson = JSON.parse(resultText);
      res.json(resultJson);
    } catch (error: any) {
      console.error("Sentiment analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze sentiment" });
    }
  });

  // AI Toxicity and Moderation API
  app.post("/api/ai/moderate", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Missing or invalid 'text' field" });
      }

      const ai = getAiClient();
      const prompt = `Review the following citizen post or comment for civic platform safety guidelines. Identify if it contains toxicity, hate speech, abusive language, harassment, threats, or severe misinformation.
      
  Content:
  "${text}"

  Return a JSON object indicating if the content should be flagged, along with categories of violation and a short feedback/rationale.

  Response JSON format:
  {
    "flagged": boolean,
    "categories": {
      "hateSpeech": boolean,
      "abuse": boolean,
      "harassment": boolean,
      "threats": boolean,
      "misinformation": boolean
    },
    "rationale": "string"
  }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini");
      }
      const resultJson = JSON.parse(resultText);
      res.json(resultJson);
    } catch (error: any) {
      console.error("Moderation error:", error);
      res.status(500).json({ error: error.message || "Failed to moderate content" });
    }
  });

  // AI Fake News Warning and Claims Analyzer API
  app.post("/api/ai/fake-news", async (req, res) => {
    try {
      const { title, description } = req.body;
      if (!description) {
        return res.status(400).json({ error: "Missing 'description' field" });
      }

      const ai = getAiClient();
      const prompt = `Evaluate the following news, political post, or civic complaint for potential misinformation, unverified sensational claims, or fake news signals. Frame it with high responsibility.
      
  Title: "${title || ""}"
  Description: "${description}"

  Determine if it contains potentially misleading or unverified claims that are highly disputed, scientifically false, or structurally designed to spread misinformation.
  Return a JSON object with "flagged" (true if warning is recommended), "warningMessage" (a user-facing warning advisory banner text, or empty if false), and "explanation" (detailed rationale for the warning/verification guidance).

  Response JSON format:
  {
    "flagged": boolean,
    "warningMessage": "string",
    "explanation": "string"
  }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini");
      }
      const resultJson = JSON.parse(resultText);
      res.json(resultJson);
    } catch (error: any) {
      console.error("Fake news warning analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze claims" });
    }
  });

  // AI Automatic Summaries (Weekly, Area-wise, Leader performance) API
  app.post("/api/ai/summarize", async (req, res) => {
    try {
      const { type, items, name } = req.body; // type: "area" | "leader", items: list of posts/issues
      if (!type || !items || !Array.isArray(items)) {
        return res.status(400).json({ error: "Missing or invalid parameters. 'type' (string) and 'items' (array) are required." });
      }

      const ai = getAiClient();
      const prompt = `Generate a high-quality civic and political summary for a ${type === "leader" ? "Political Leader" : "Geographic Area"} based on the community's posts, comments, and reported issues.
      
  Target Name: "${name || "Unknown"}"
  Type: "${type}"
  Number of Items Collected: ${items.length}

  Items Content Overview:
  ${JSON.stringify(items.slice(0, 15).map(item => ({ title: item.title, description: item.description, category: item.category, status: item.status, sentiment: item.sentiment })))}

  Please generate:
  1. A summary of overall public sentiment and active civic concerns.
  2. Highlight the most reported issue categories (e.g., Roads, Sanitation, Water).
  3. Mention positive development achievements reported by citizens, if any.
  4. Provide a forward-looking civic evaluation score (0 to 100) and actionable community advice.

  Response JSON format:
  {
    "summary": "string",
    "topIssues": ["string"],
    "developmentHighlights": ["string"],
    "civicScore": number,
    "advice": "string"
  }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini");
      }
      const resultJson = JSON.parse(resultText);
      res.json(resultJson);
    } catch (error: any) {
      console.error("Summary generator error:", error);
      res.status(500).json({ error: error.message || "Failed to generate summary" });
    }
  });

  // AI Issue Clustering API
  app.post("/api/ai/cluster", async (req, res) => {
    try {
      const { issues } = req.body; // Array of issues { id, title, description, location }
      if (!issues || !Array.isArray(issues)) {
        return res.status(400).json({ error: "Missing or invalid 'issues' array" });
      }

      if (issues.length < 2) {
        return res.json({ clusters: [] });
      }

      const ai = getAiClient();
      const prompt = `We have multiple citizen-reported civic issues in an administrative area. Analyze their text (titles and descriptions) to group/cluster very similar, duplicated, or related reports together (e.g., multiple complaints about the exact same broken pipe or water shortage in the same locality).
      
  Issues list:
  ${JSON.stringify(issues.map(i => ({ id: i.id, title: i.title, description: i.description, category: i.category, locality: i.location?.panchayat || i.location?.block })))}

  Return a JSON array of clusters, where each cluster lists the IDs of the issues that belong together, a "clusterName" representing the common issue, and a short "combinedSummary".

  Response JSON format:
  {
    "clusters": [
      {
        "clusterName": "string",
        "combinedSummary": "string",
        "issueIds": ["string"]
      }
    ]
  }`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from Gemini");
      }
      const resultJson = JSON.parse(resultText);
      res.json(resultJson);
    } catch (error: any) {
      console.error("Issue clustering error:", error);
      res.status(500).json({ error: error.message || "Failed to cluster issues" });
    }
  });

  // API endpoint to return Firebase configuration to the client securely
  app.get("/api/firebase-config", (req, res) => {
    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      res.sendFile(configPath);
    } catch (err: any) {
      res.status(500).json({ error: "Failed to read Firebase config file" });
    }
  });

  // Vite Middleware setup for Asset Serving in Dev vs Prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoterLens Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
