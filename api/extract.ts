import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build-vercel',
    }
  }
});

export default async function handler(req: any, res: any) {
  // Handle CORS and preflight requests
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { data, mimeType } = req.body;
    if (!data || !mimeType) {
      return res.status(400).json({ error: "Missing data or mimeType" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: "GEMINI_API_KEY belum dikonfigurasi di Environment Variables Vercel Anda." 
      });
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
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Vercel extraction error:", error);
    return res.status(500).json({ error: error.message || "Failed to extract certificate details" });
  }
}
