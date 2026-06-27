import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import fs from "fs";
import cors from "cors";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

let db: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(firebaseConfigPath)) {
    const configRaw = fs.readFileSync(firebaseConfigPath, "utf-8");
    const firebaseConfig = JSON.parse(configRaw);
    const finalConfig = firebaseConfig.default || firebaseConfig;
    const app = initializeApp(finalConfig);
    db = getFirestore(app, finalConfig.firestoreDatabaseId || "ai-studio-40528eed-0559-4c22-b7a5-6fd23c02df7c");
  }
} catch (error) {
  console.error("Failed to initialize Firebase on server:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for all routes so other websites can fetch from this API
  app.use(cors());

  // Increase payload limit for large base64 files
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API endpoints
  
  // Public API to get certificate stats for a user
  app.get("/api/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query; // YYYY-MM-DD
      
      if (!db) {
        return res.status(500).json({ error: "Database not initialized" });
      }

      let targetUid = userId;
      
      // Resolve username to UID if necessary
      const usersRef = collection(db, "users");
      let userDoc = null;
      try {
        const userDocRef = doc(db, "users", userId);
        userDoc = await getDoc(userDocRef);
      } catch (e) {
        // Ignore errors
      }
      
      if (!userDoc || !userDoc.exists()) {
        // Try as username
        const qUser = query(usersRef, where("username", "==", userId));
        const userQuerySnapshot = await getDocs(qUser);
        if (!userQuerySnapshot.empty) {
          targetUid = userQuerySnapshot.docs[0].data().uid;
        }
      } else {
        targetUid = userDoc.data().uid;
      }

      const certsRef = collection(db, "certificates");
      const q = query(certsRef, where("userId", "==", targetUid));
      
      const querySnapshot = await getDocs(q);
      let certs: any[] = [];
      querySnapshot.forEach((doc) => {
        certs.push({ id: doc.id, ...doc.data() });
      });

      // Filter by date range if provided
      if (startDate || endDate) {
        certs = certs.filter(cert => {
          if (!cert.date) return false;
          const certDate = new Date(cert.date);
          let isValid = true;
          if (startDate && new Date(startDate as string) > certDate) isValid = false;
          if (endDate && new Date(endDate as string) < certDate) isValid = false;
          return isValid;
        });
      }

      res.json({
        userId,
        totalCertificates: certs.length,
        dateRange: {
          start: startDate || "all",
          end: endDate || "all"
        }
      });

    } catch (error: any) {
      console.error("Stats API error:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.post("/api/extract", async (req, res) => {
    try {
      const { data, mimeType } = req.body;
      if (!data || !mimeType) {
        return res.status(400).json({ error: "Missing data or mimeType" });
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              inlineData: {
                data: data,
                mimeType: mimeType,
              },
            },
            {
              text: "Extract the details from this certificate. Return a JSON object with: \n" +
                "- 'title' (The specific topic, class name, course name, or event name of the certificate, e.g., 'React Web Development', 'Machine Learning Specialization', 'Belajar Dasar Pemrograman', or 'Juara 1 UI/UX Design'. WARNING: Do NOT use generic files/text like 'Certificate of Completion', 'Certificate of Achievement', 'Sertifikat Kelulusan', or 'Sertifikat Penghargaan' as the title under any circumstances! Instead, always find and use the exact name of the course, class, topic, or competition)\n" +
                "- 'category' (MUST be one of: 'Profesional', 'Kursus & Pelatihan', 'Magang', 'Bahasa', 'Kompetisi', 'Organisasi', 'Seminar & Workshop', 'Akademik')\n" +
                "- 'date' (extract issue date, try format 'YYYY-MM-DD' or as written)\n" +
                "- 'issuingOrganization' (the platform, university, company or club that issued this certificate, e.g., MySkill, Google, Dicoding, Coursera, Udemy, etc.)\n" +
                "- 'issueMonth' (1-based number of the month of issue, e.g., '1' for January, '12' for December, as string, or empty string if not found)\n" +
                "- 'issueYear' (4-digit year of issue, e.g., '2025', as string, or empty string if not found)\n" +
                "- 'credentialId' (Credential / Certificate ID or serial number, if any, or empty string if not found)\n" +
                "- 'skills' (comma-separated list of 3-5 keywords of skills associated with this certificate, e.g., 'React, JavaScript, Tailwind CSS' or empty string if not found).\n" +
                "Note: Categorize carefully into the correct category from the list above based on its nature."
            }
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                date: { type: Type.STRING },
                issuingOrganization: { type: Type.STRING },
                issueMonth: { type: Type.STRING },
                issueYear: { type: Type.STRING },
                credentialId: { type: Type.STRING },
                skills: { type: Type.STRING },
              },
              required: ["title", "category", "date", "issuingOrganization", "issueMonth", "issueYear", "credentialId", "skills"]
            }
          }
        });
      } catch (err: any) {
        console.warn("Primary model failed, attempting fallback to gemini-3.1-flash-lite...", err);
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: [
              {
                inlineData: {
                  data: data,
                  mimeType: mimeType,
                },
              },
              {
                text: "Extract the details from this certificate. Return a JSON object with: \n" +
                  "- 'title' (The specific topic, class name, course name, or event name of the certificate, e.g., 'React Web Development', 'Machine Learning Specialization', 'Belajar Dasar Pemrograman', or 'Juara 1 UI/UX Design'. WARNING: Do NOT use generic files/text like 'Certificate of Completion', 'Certificate of Achievement', 'Sertifikat Kelulusan', or 'Sertifikat Penghargaan' as the title under any circumstances! Instead, always find and use the exact name of the course, class, topic, or competition)\n" +
                  "- 'category' (MUST be one of: 'Profesional', 'Kursus & Pelatihan', 'Magang', 'Bahasa', 'Kompetisi', 'Organisasi', 'Seminar & Workshop', 'Akademik')\n" +
                  "- 'date' (extract issue date, try format 'YYYY-MM-DD' or as written)\n" +
                  "- 'issuingOrganization' (the platform, university, company or club that issued this certificate, e.g., MySkill, Google, Dicoding, Coursera, Udemy, etc.)\n" +
                  "- 'issueMonth' (1-based number of the month of issue, e.g., '1' for January, '12' for December, as string, or empty string if not found)\n" +
                  "- 'issueYear' (4-digit year of issue, e.g., '2025', as string, or empty string if not found)\n" +
                  "- 'credentialId' (Credential / Certificate ID or serial number, if any, or empty string if not found)\n" +
                  "- 'skills' (comma-separated list of 3-5 keywords of skills associated with this certificate, e.g., 'React, JavaScript, Tailwind CSS' or empty string if not found).\n" +
                  "Note: Categorize carefully into the correct category from the list above based on its nature."
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  date: { type: Type.STRING },
                  issuingOrganization: { type: Type.STRING },
                  issueMonth: { type: Type.STRING },
                  issueYear: { type: Type.STRING },
                  credentialId: { type: Type.STRING },
                  skills: { type: Type.STRING },
                },
                required: ["title", "category", "date", "issuingOrganization", "issueMonth", "issueYear", "credentialId", "skills"]
              }
            }
          });
        } catch (fallbackErr: any) {
          const isQuota = [err, fallbackErr].some(e => 
            e?.status === 429 || 
            e?.message?.includes('429') || 
            e?.message?.includes('RESOURCE_EXHAUSTED') || 
            e?.message?.includes('quota')
          );
          if (isQuota) {
            return res.status(429).json({ 
              error: "Batas pemindaian gratis (quota limit) Gemini AI telah tercapai. Silakan coba kembali beberapa saat lagi atau isi form secara manual." 
            });
          }
          throw fallbackErr;
        }
      }

      const jsonStr = response.text?.trim();
      if (!jsonStr) {
         throw new Error("No response from AI");
      }
      
      const result = JSON.parse(jsonStr);
      res.json(result);
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract certificate details" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
