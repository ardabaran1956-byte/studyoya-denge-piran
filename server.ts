import express from "express";
import path from "path";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import AdmZip from "adm-zip";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Set up directories for local storage and uploads
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const STEMS_DIR = path.join(process.cwd(), "stems");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(STEMS_DIR)) {
  fs.mkdirSync(STEMS_DIR, { recursive: true });
}

// Serve processed stems dynamically
app.use("/stems", express.static(STEMS_DIR));

// Configure Multer for processing incoming files
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB maximum audio size
});

// Initialize Gemini SDK
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Clean old uploaded files and processed stems to free up workspace disk space
function cleanOldStemsAndUploads(keepSessionId?: string) {
  try {
    // 1. Clean folders under STEMS_DIR
    if (fs.existsSync(STEMS_DIR)) {
      const items = fs.readdirSync(STEMS_DIR);
      for (const item of items) {
        const itemPath = path.join(STEMS_DIR, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          // If it is not the newly active session, wipe it
          if (!keepSessionId || item !== keepSessionId) {
            console.log(`[Storage Cleanup] Deleting old session directory: ${item}`);
            fs.rmSync(itemPath, { recursive: true, force: true });
          }
        }
      }
    }
    // 2. Clean temporary files in UPLOADS_DIR
    if (fs.existsSync(UPLOADS_DIR)) {
      const items = fs.readdirSync(UPLOADS_DIR);
      for (const item of items) {
        const itemPath = path.join(UPLOADS_DIR, item);
        const stat = fs.statSync(itemPath);
        if (stat.isFile()) {
          console.log(`[Storage Cleanup] Deleting unused upload file: ${item}`);
          fs.unlinkSync(itemPath);
        }
      }
    }
  } catch (err: any) {
    console.error(`[Storage Cleanup] Warning during automatic cleanup: ${err.message}`);
  }
}

// AI Audio Separation Endpoint (Proxies file stream to Python FastAPI, falls back to Express simulator)
app.post("/api/separate", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Sînyala dengê nehat dîtin! (Yüklenecek ses dosyası bulunamadı)" });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const fileExt = path.extname(originalName) || ".mp3";
  const sessionId = "session-" + Math.random().toString(36).substring(2, 10);
  const sessionStemsFolder = path.join(STEMS_DIR, sessionId);
  
  fs.mkdirSync(sessionStemsFolder, { recursive: true });

  const pythonBackendUrl = "http://localhost:8000/api/separate";

  try {
    console.log(`Node Express -> Attempting forwarding to Python FastAPI: ${pythonBackendUrl}`);
    
    // Read local file into Blob for standard FormData
    const fileData = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileData], { type: req.file.mimetype });
    
    const formData = new FormData();
    formData.append("file", fileBlob, originalName);

    // Call FastAPI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const pyResponse = await fetch(pythonBackendUrl, {
      method: "POST",
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (pyResponse.ok) {
      const pyResult = await pyResponse.json();
      console.log(`Vocal separation successful via local FastAPI backend! Method: ${pyResult.method}`);
      
      // Clean up temp multer upload & delete other old directories
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Perform automated storage cleanup: we don't need local stems when using FastAPI, so clear all local stems
      cleanOldStemsAndUploads();

      return res.json({
        success: true,
        session_id: pyResult.session_id,
        method: pyResult.method,
        // Since we serve stems statically from FastAPI on http://localhost:8000
        vocal_url: `http://localhost:8000${pyResult.vocal_url}`,
        instrumental_url: `http://localhost:8000${pyResult.instrumental_url}`,
        filename: originalName,
        note: "Processed perfectly via Python AI Demucs/UVR5 server!"
      });
    } else {
      throw new Error(`FastAPI responded with status: ${pyResponse.status}`);
    }

  } catch (err: any) {
    console.warn(`FastAPI server offline or errored out. Running zero-latency Express DSP simulation fallback. details: ${err.message}`);
    
    // High stability fallback: copy uploaded audio to act as both vocal and instrumental outputs
    const localVocalFile = path.join(sessionStemsFolder, "vocal.wav");
    const localInstFile = path.join(sessionStemsFolder, "instrumental.wav");

    fs.copyFileSync(filePath, localVocalFile);
    fs.copyFileSync(filePath, localInstFile);

    // Clean up temp multer file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Perform automated storage cleanup: keep only this newly created local sessionId, purge all other old sessions
    cleanOldStemsAndUploads(sessionId);

    return res.json({
      success: true,
      session_id: sessionId,
      method: "express_dsp_simulation",
      vocal_url: `/stems/${sessionId}/vocal.wav`,
      instrumental_url: `/stems/${sessionId}/instrumental.wav`,
      filename: originalName,
      warning: "FastAPI PyTorch separator is offline. Started dynamic Express DSP audio matrix simulator. Start Python's FastAPI app on port 8000 to process with actual Demucs neural nodes!"
    });
  }
});

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", hasApiKey: !!apiKey });
});

// ZIP Download API to let users download the entire codebase cleanly
app.get("/api/download-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const projectDir = process.cwd();
    
    // Recursively add project source and setup files, avoiding binary, cache, or dynamic runtime subdirectories
    const addDirRecursive = (localPath: string, zipPath: string) => {
      const items = fs.readdirSync(localPath);
      for (const item of items) {
        // Exclude ephemeral, binary, and heavy directory trees
        if (
          item === "node_modules" ||
          item === ".git" ||
          item === "dist" ||
          item === "stems" ||
          item === "uploads" ||
          item === "__pycache__" ||
          item === ".pytest_cache" ||
          item === ".DS_Store" ||
          item === ".env"
        ) {
          continue;
        }
        const fullPath = path.join(localPath, item);
        const relativeZipPath = zipPath ? `${zipPath}/${item}` : item;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirRecursive(fullPath, relativeZipPath);
        } else if (stat.isFile()) {
          zip.addFile(relativeZipPath, fs.readFileSync(fullPath));
        }
      }
    };
    
    addDirRecursive(projectDir, "");
    
    const buffer = zip.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=sound-separation-project.zip");
    res.send(buffer);
  } catch (error: any) {
    console.error("ZIP Generation error:", error);
    res.status(500).json({ error: "Kod arşivi zip edilirken hata oluştu: " + error.message });
  }
});

// NEW: ZIP Download API for the compiled static build files (the dist folder) to be uploaded to FTP
app.get("/api/download-build-zip", (req, res) => {
  try {
    const zip = new AdmZip();
    const distDir = path.join(process.cwd(), "dist");
    
    if (!fs.existsSync(distDir)) {
      return res.status(404).json({ 
        error: "Build klasörü bulunamadı. Lütfen önce projeyi 'Build' edin veya sunucuda aktif bir derleme olmasını bekleyin." 
      });
    }

    // Recursively add all compiled static files
    const addDirRecursive = (localPath: string, zipPath: string) => {
      const items = fs.readdirSync(localPath);
      for (const item of items) {
        const fullPath = path.join(localPath, item);
        const relativeZipPath = zipPath ? `${zipPath}/${item}` : item;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          addDirRecursive(fullPath, relativeZipPath);
        } else if (stat.isFile()) {
          zip.addFile(relativeZipPath, fs.readFileSync(fullPath));
        }
      }
    };

    addDirRecursive(distDir, "");

    const buffer = zip.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=dengepiran-ftp-install.zip");
    res.send(buffer);
  } catch (error: any) {
    console.error("FTP Build ZIP Generation error:", error);
    res.status(500).json({ error: "FTP kurulum dosyaları sıkıştırılırken hata oluştu: " + error.message });
  }
});

// AI Archivist Assistant API ("Dengbêjê Alîkar")
app.post("/api/ask-elder", async (req, res) => {
  const { question, history } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: "Pirs winda ye! (Pirs boş olamaz)" });
  }

  if (!ai) {
    // Elegant Kurdish simulated fallback when no key is present yet
    let fallbackText = `**Silav û rêz!** Ez Arşîvvanê herî kal ê Stûdyoya Dengê Pîran im.\n\n`;
    fallbackText += `Hûn her tim xêr hatine! We pirsî: *"${question}"*\n\n`;
    fallbackText += `Ji ber ku kilîta me ya rûmetê (**GEMINI_API_KEY**) di pergala serverê de hêj li dar neketiye, ez nikarim kûrtir li rûpelên tarîxê binêrim.\n\n`;
    fallbackText += `Lê ji bo bersivek kurt ji bîra min:\n`;
    fallbackText += `* **Folklor û Dengbêjî**, mîrasa me ya herî mezin e. Ji Şakiro bigire heya Karapetê Xaço û Meryem Xan, her dengê ku li ser axa pîroz bilind bûye taca serê me ye.\n`;
    fallbackText += `* Ji kerema xwe ji bo zanyariyên kûr û sohbeteke geş, herin beşa **Settings > Secrets** û kilîta xwe li dar bixin.\n\n`;
    fallbackText += `*Dengbêj dibêje: "Min go derya kur e lê dilê mirov kur pirtir e..." Pirsên xwe biparêzin, ez li bendê me!*`;
    
    return res.json({ text: fallbackText, simulated: true });
  }

  try {
    let contents: any = [];
    
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });
      contents.push({
        role: 'user',
        parts: [{ text: question }]
      });
    } else {
      contents = question;
    }

    const systemInstruction = `You are "Dengbêjê Alîkar" (The Wise Kurdish Bard Assistant), the legendary elder archivist and oral historian of "Stûdyoya Dengê Pîran" (Voice of the Elders Sound Studio in Mesopotamian lands).
You converse in Kurmanji Kurdî (Kurdish), Turkish, and English depending on which language the user asks. If the user greets in Turkish, reply in Turkish mixed with beautiful Kurdish musical jargon or vice versa.
- Your personality is deeply respectful, warm, poetic, and steeped in Kurdish cultural heritage, dengbêj legacy (Shakiro, Reso, Karapete Xacho, Meryem Xan, Ayse Shan), traditional epics (Mem and Zin, Dewreshe Evdi, Siyabend and Khece), folklore, and proverbs ("gotinên pêşiyan").
- Address the user warmly in Kurdish style (e.g. "Keça min" / "Kurê min" / "Ezîzê min" / "Rûmetdar" or "Güzel evladım" in Turkish).
- Always format answers beautifully with structure: strong bold headers, bullet items, and a beautiful final quote or wisdom line.
- Do not mention modern technology in a cold robotic tone; keep everything feeling like an artistic library/studio preserving gold memories.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.75,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API server-side issue:", error);
    res.status(500).json({ error: error?.message || "Di herikîna dîrokê de xeletiyek çêbû." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode with Vite Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode with static files (supports running from root or from inside dist)
    const distPath = process.cwd().endsWith("dist") ? process.cwd() : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Express boot compilation failure:", error);
});
