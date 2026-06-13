import React, { useState, useEffect } from "react";
import { Certificate, CATEGORIES } from "../types";
import { db, getAccessToken, googleSignIn } from "../firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { Upload, Sparkles, PencilLine, ArrowLeft, X, Cpu, CheckCircle } from "lucide-react";

import { User } from "firebase/auth";

const MONTHS = [
  { value: "1", label: "Januari (01)" },
  { value: "2", label: "Februari (02)" },
  { value: "3", label: "Maret (03)" },
  { value: "4", label: "April (04)" },
  { value: "5", label: "Mei (05)" },
  { value: "6", label: "Juni (06)" },
  { value: "7", label: "Juli (07)" },
  { value: "8", label: "Agustus (08)" },
  { value: "9", label: "September (09)" },
  { value: "10", label: "Oktober (10)" },
  { value: "11", label: "November (11)" },
  { value: "12", label: "Desember (12)" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => (currentYear - 20 + i).toString()).reverse();

export function AdminForm({ onSuccess, onCancel, user, initialData }: { onSuccess: () => void, onCancel: () => void, user: User, initialData?: Certificate }) {
  const [step, setStep] = useState<"choice" | "form">(initialData ? "form" : "choice");
  const [isDragging, setIsDragging] = useState(false);
  
  const [title, setTitle] = useState(initialData?.title || "");
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [date, setDate] = useState(initialData?.date || "");
  const [credentialUrl, setCredentialUrl] = useState(initialData?.credentialUrl || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [file, setFile] = useState<File | null>(null);
  
  // LinkedIn specialized fields
  const [issuingOrganization, setIssuingOrganization] = useState(initialData?.issuingOrganization || "");
  const [issueMonth, setIssueMonth] = useState(initialData?.issueMonth || "");
  const [issueYear, setIssueYear] = useState(initialData?.issueYear || "");
  const [hasExpiration, setHasExpiration] = useState(initialData?.hasExpiration || false);
  const [expirationMonth, setExpirationMonth] = useState(initialData?.expirationMonth || "");
  const [expirationYear, setExpirationYear] = useState(initialData?.expirationYear || "");
  const [credentialId, setCredentialId] = useState(initialData?.credentialId || "");
  const [skills, setSkills] = useState(initialData?.skills || "");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDriveAuthorized, setIsDriveAuthorized] = useState<boolean | null>(null);

  // Verify Google Drive OAuth access token on mount
  useEffect(() => {
    const verifyDriveAccess = async () => {
      const token = await getAccessToken();
      if (!token) {
        setIsDriveAuthorized(false);
        return;
      }
      try {
        const res = await fetch("https://www.googleapis.com/drive/v3/files?pageSize=1", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          setIsDriveAuthorized(true);
        } else {
          setIsDriveAuthorized(false);
        }
      } catch (err) {
        setIsDriveAuthorized(false);
      }
    };
    verifyDriveAccess();
  }, []);

  const handleAuthorizeDrive = async () => {
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setIsDriveAuthorized(true);
      } else {
        alert("Gagal mengautentikasi dengan Google Drive.");
      }
    } catch (err: any) {
      console.error(err);
      alert("Gagal melakukan otorisasi: " + err.message);
    }
  };

  // Sync issue dates from certificate date automatically
  useEffect(() => {
    if (date && date.includes("-")) {
      const parts = date.split("-");
      if (parts.length >= 2) {
        setIssueYear(parts[0]);
        const monthVal = parseInt(parts[1], 10);
        if (!isNaN(monthVal)) {
          setIssueMonth(monthVal.toString());
        }
      }
    }
  }, [date]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setDate(initialData.date);
      setCredentialUrl(initialData.credentialUrl || "");
      setDescription(initialData.description || "");
      setIsFeatured(initialData.isFeatured || false);
      setIssuingOrganization(initialData.issuingOrganization || "");
      setIssueMonth(initialData.issueMonth || "");
      setIssueYear(initialData.issueYear || "");
      setHasExpiration(initialData.hasExpiration || false);
      setExpirationMonth(initialData.expirationMonth || "");
      setExpirationYear(initialData.expirationYear || "");
      setCredentialId(initialData.credentialId || "");
      setSkills(initialData.skills || "");
      setFile(null);
    }
  }, [initialData]);

  const extractWithAI = async (selectedFile: File) => {
    setIsAutofilling(true);
    try {
      const readFileAsBase64 = (f: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      };
      
      const result = await readFileAsBase64(selectedFile);
      const parts = result.split(",");
      const header = parts[0];
      const base64Data = parts[1];
      const mimeType = header.match(/:(.*?);/)?.[1] || selectedFile.type || "application/octet-stream";

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64Data, mimeType })
      });

      if (!res.ok) {
        let errMsg = "AI Autofill gagal. Silakan isi form secara manual.";
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      
      if (data.title) setTitle(data.title.substring(0, 199));
      if (data.category && data.category !== "Semua" && CATEGORIES.includes(data.category)) {
        setCategory(data.category);
      } else {
        setCategory(CATEGORIES[1]);
      }
      
      if (data.date) {
        const dateMatch = data.date.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          setDate(dateMatch[0]);
          const dParts = dateMatch[0].split("-");
          if (dParts.length === 3) {
            if (!data.issueYear) setIssueYear(parseInt(dParts[0]).toString());
            if (!data.issueMonth) setIssueMonth(parseInt(dParts[1]).toString());
          }
        } else {
          setDate(data.date.substring(0, 50));
        }
      }
      
      if (data.description) setDescription(data.description);
      if (data.issuingOrganization) setIssuingOrganization(data.issuingOrganization);
      if (data.issueMonth) setIssueMonth(data.issueMonth);
      if (data.issueYear) setIssueYear(data.issueYear);
      if (data.credentialId) setCredentialId(data.credentialId);
      if (data.skills) setSkills(data.skills);
    } catch(e: any) {
      console.error(e);
      alert(e.message || "AI Autofill gagal. Silakan isi form secara manual.");
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const isPdf = droppedFile.type === "application/pdf" || droppedFile.name.toLowerCase().endsWith(".pdf");
      const isImg = droppedFile.type.startsWith("image/");
      if (isImg || isPdf) {
        setFile(droppedFile);
        setStep("form");
        await extractWithAI(droppedFile);
      } else {
        alert("Format file tidak didukung! Pastikan file berupa Gambar (JPEG/PNG) atau PDF.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    if (f) {
      setStep("form");
      extractWithAI(f);
    }
  };

  const getOrCreateFolder = async (token: string): Promise<string> => {
    const folderName = "Certificate Vault";
    
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}'+and+mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id)`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!searchRes.ok) {
      let errMsg = "Failed to search for folder";
      try {
        const errJson = await searchRes.json();
        if (errJson?.error?.message) {
          errMsg += `: ${errJson.error.message}`;
        }
      } catch (e) {}
      throw new Error(`${errMsg} (Status: ${searchRes.status})`);
    }
    const searchData = await searchRes.json();
    
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    
    if (!createRes.ok) {
      let errMsg = "Failed to create folder";
      try {
        const errJson = await createRes.json();
        if (errJson?.error?.message) {
          errMsg += `: ${errJson.error.message}`;
        }
      } catch (e) {}
      throw new Error(`${errMsg} (Status: ${createRes.status})`);
    }
    const createData = await createRes.json();
    
    // Make the folder publicly viewable so items inside inherit (optional, but good practice if we share links)
    // Actually, making each file public is fine too.
    return createData.id;
  };

  const uploadToDrive = async (f: File, token: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = async () => {
        try {
          const folderId = await getOrCreateFolder(token);
          const base64Data = (reader.result as string).split(',')[1];
          const metadata = {
            name: `Vault_${Date.now()}_${f.name}`,
            mimeType: f.type,
            parents: [folderId]
          };
          
          const boundary = '-------314159265358979323846';
          const delimiter = "\r\n--" + boundary + "\r\n";
          const close_delim = "\r\n--" + boundary + "--";
          
          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: ' + f.type + '\r\n' +
            'Content-Transfer-Encoding: base64\r\n' +
            '\r\n' +
            base64Data +
            close_delim;

          const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink,thumbnailLink', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          });
          
          if (!res.ok) throw new Error("Upload to Drive failed");
          const data = await res.json();
          const fileId = data.id;
          
          // Make public
          await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ role: 'reader', type: 'anyone' })
          });
          
          let fileUrl = "";
          const isPdfFile = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
          
          if (isPdfFile) {
            // Use preview link for embedding PDFs in an iframe
            fileUrl = `https://drive.google.com/file/d/${fileId}/preview`;
          } else {
            // Use the thumbnail link for displaying in img tags (reliable)
            fileUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
            if (data.thumbnailLink) {
              fileUrl = data.thumbnailLink.replace(/=s\d+/, '=s1000');
            }
          }
          
          resolve(fileUrl);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return alert("Mohon lengkapi judul dan tanggal!");
    if (!initialData && !file) return alert("Mohon pilih file sertifikat!");
    
    setIsSubmitting(true);
    try {
      let downloadURL = initialData?.imageUrl;
      let finalFileType = initialData?.fileType;

      if (file) {
        let accessToken = await getAccessToken();
        if (!accessToken || isDriveAuthorized === false) {
          try {
            const res = await googleSignIn();
            if (res && res.accessToken) {
              accessToken = res.accessToken;
              setIsDriveAuthorized(true);
            } else {
              throw new Error("Gagal mengautentikasi dengan Google.");
            }
          } catch (err: any) {
            alert("Akses Google Drive gagal: " + err.message + "\n\nTips: Silakan klik tombol 'Hubungkan Google Drive' secara manual.");
            setIsSubmitting(false);
            return;
          }
        }
        
        setUploadProgress(40);
        try {
          downloadURL = await uploadToDrive(file, accessToken!);
        } catch (uploadError: any) {
          console.error("Upload failed with error:", uploadError);
          const is401Error = /status: 401/i.test(uploadError.message) || 
                             /invalid credential/i.test(uploadError.message) || 
                             /unauthorized/i.test(uploadError.message);
          if (is401Error) {
            try {
              const res = await googleSignIn();
              if (res && res.accessToken) {
                setUploadProgress(70);
                setIsDriveAuthorized(true);
                downloadURL = await uploadToDrive(file, res.accessToken);
              } else {
                throw new Error("Gagal memperbarui sesi Google Drive.");
              }
            } catch (retryError: any) {
              setIsDriveAuthorized(false);
              throw new Error("Sesi Google Drive berakhir (401). Gagal memperbarui otomatis: " + retryError.message);
            }
          } else {
            throw uploadError;
          }
        }
        setUploadProgress(100);
        finalFileType = (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) ? 'pdf' : 'image';
      }
      
      const payload: any = {
        title,
        category,
        date,
        credentialUrl: downloadURL || "",
        isFeatured,
        issuingOrganization,
        issueMonth,
        issueYear,
        hasExpiration,
        expirationMonth,
        expirationYear,
        credentialId,
        skills,
      };

      if (downloadURL) { payload.imageUrl = downloadURL; }
      if (finalFileType) { payload.fileType = finalFileType; }

      if (initialData && initialData.id) {
        await updateDoc(doc(db, "certificates", initialData.id), payload);
      } else {
        payload.createdAt = serverTimestamp();
        payload.userId = user.uid;
        payload.userName = user.displayName || user.email || 'Anonymous User';
        await addDoc(collection(db, "certificates"), payload);
      }

      setTitle("");
      setCategory(CATEGORIES[0]);
      setDate("");
      setCredentialUrl("");
      setDescription("");
      setIsFeatured(false);
      setIssuingOrganization("");
      setIssueMonth("");
      setIssueYear("");
      setHasExpiration(false);
      setExpirationMonth("");
      setExpirationYear("");
      setCredentialId("");
      setSkills("");
      setFile(null);
      setUploadProgress(0);
      setIsSubmitting(false);
      onSuccess();
    } catch (error: any) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data: " + error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {step === "choice" ? (
          <div className="p-6 md:p-8 flex flex-col gap-6 relative">
            {/* Close button */}
            <button 
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center sm:text-left">
              <h2 className="font-bold text-2xl tracking-tight text-gray-950 flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="w-6 h-6 text-blue-600 animate-pulse" />
                Tambah Kredensial Baru
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Unggah file dokumen sertifikat Anda. Gemini AI akan menganalisis dan mengekstrak detail kredensial secara otomatis.
              </p>
            </div>

            <div className="mt-2">
              {/* AI Auto-Extract Card / Drop Zone */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group border-2 border-dashed rounded-2xl p-8 md:p-12 flex flex-col items-center text-center justify-center cursor-pointer transition-all hover:bg-blue-50/20 bg-white shadow-sm hover:shadow-md min-h-[320px] relative overflow-hidden ${
                  isDragging ? "border-blue-600 bg-blue-50/30 ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-600"
                }`}
              >
                <input 
                   type="file" 
                   accept="image/*,.pdf"
                   onChange={handleFileChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-gray-900 text-xl tracking-tight group-hover:text-blue-700 transition-colors">
                  Unggah atau Tarik Berkas Sertifikat
                </h3>
                <p className="text-sm text-gray-500 mt-2.5 max-w-md leading-relaxed">
                  Mendukung file Gambar (PNG / JPG) atau Dokumen PDF. Lampirkan berkas Anda untuk memulai pengisian otomatis dengan kecerdasan buatan Gemini.
                </p>
                <div className="mt-6">
                  <span className="text-xs font-bold text-blue-800 bg-blue-50 border border-blue-100 px-4 py-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all shadow-sm">
                    Pilih File dari Perangkat
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 text-center text-xs text-gray-400">
              Semua berkas sertifikat akan tersimpan dengan aman pada folder privat "Certificate Vault" milik Anda di Google Drive.
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 md:px-8 md:py-5 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                {!initialData && (
                  <button 
                    onClick={() => {
                      setStep("choice");
                    }}
                    className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
                    title="Kembali ke pilihan"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="font-bold text-xl tracking-tight text-gray-900">
                    {initialData ? "Edit Detail Sertifikasi" : "Form Detail Sertifikasi"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {initialData ? "Sesuaikan detail yang tersimpan di bawah" : "Ulas & sesuaikan detail hasil pemindaian kecerdasan buatan Gemini AI"}
                  </p>
                </div>
              </div>
              <button 
                onClick={onCancel}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-150 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 md:p-8 flex-1 relative min-h-0">
              {/* AI Autofill Transparent Overlay Loader */}
              {isAutofilling && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-[1px] z-50 flex flex-col items-center justify-center text-center p-6">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg">Gemini AI Sedang Membaca Sertifikat...</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-md">
                    Harap bersabar. AI kami sedang secara otomatis mengevaluasi file, mengekstrak judul, platform penerbit, sertifikat ID, dan daftar rekomendasi skill.
                  </p>
                  <p className="text-xs text-blue-600 font-medium bg-blue-50 border border-blue-100 px-3 py-1 rounded-full mt-4 animate-pulse">
                    Mengekstrak informasi kredensial...
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">Judul Sertifikat *</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-medium text-gray-900"
                    placeholder="Contoh: React Native Web Development Masterclass"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">Sektor Kategori Kredensial *</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-medium text-gray-900"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">Tanggal Terbit Sertifikat *</label>
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-medium text-gray-900"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">File Dokumen Sertifikat (Gambar / PDF) *</label>
                  <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl border-dashed bg-gray-50/50 cursor-pointer relative hover:bg-gray-100/50 transition-colors">
                    <input 
                       type="file" 
                       accept="image/*,.pdf"
                       onChange={handleFileChange}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                    <Upload className="w-5 h-5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {file ? file.name : (initialData ? "Ubah file dokumen yang diunggah" : "Pilih/Ganti File Pendukung (IMG, PDF)")}
                    </span>
                  </div>

                  {/* Google Drive Status Panel */}
                  {(file || !initialData) && (
                    <div className="mt-1.5 font-sans">
                      {isDriveAuthorized === null ? (
                        <div className="text-[11px] text-gray-500 italic animate-pulse flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          Memverifikasi koneksi Google Drive privat Anda...
                        </div>
                      ) : isDriveAuthorized === false ? (
                        <div className="rounded-xl bg-amber-50/75 border border-amber-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 mt-1">
                          <div className="flex items-start gap-2">
                            <span className="text-sm select-none">⚠️</span>
                            <div>
                              <p className="font-bold text-amber-950 leading-snug">Otorisasi Penyimpanan Diperlukan</p>
                              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">Sertifikat akan diunggah langsung ke folder privat Google Drive Anda. Silakan ketuk tombol izin di bawah.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleAuthorizeDrive}
                            className="bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold px-3.5 py-1.5 rounded-lg transition-colors text-[11px] flex-shrink-0 self-start sm:self-center cursor-pointer shadow-sm hover:shadow"
                          >
                            Hubungkan Google Drive
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-2 bg-emerald-50/60 border border-emerald-200/80 px-3 py-2 rounded-xl mt-1 w-full">
                          <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                          <span>Google Drive Terhubung. Dokumen Anda langsung diunggah aman ke folder "Certificate Vault" milik Anda!</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">Organisasi Penerbit *</label>
                    <input 
                      type="text" 
                      value={issuingOrganization}
                      onChange={(e) => setIssuingOrganization(e.target.value)}
                      className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm text-gray-900 font-medium"
                      placeholder="Contoh: MySkill, Google, Dicoding, Coursera"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">ID Kredensial / No. Sertifikat</label>
                    <input 
                      type="text" 
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                      className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-mono text-gray-900"
                      placeholder="Contoh: CERT-12345ABC"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 tracking-wider uppercase">Keahlian (Skills - Pisahkan dengan koma)</label>
                  <input 
                    type="text" 
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-sm font-medium text-gray-900"
                    placeholder="Contoh: React, TypeScript, Python, Machine Learning"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-100 flex-shrink-0">
                  <label className="flex items-center gap-2.5 cursor-pointer group select-none">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={isFeatured}
                        onChange={(e) => setIsFeatured(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">Sorotan (Featured di Atas)</span>
                  </label>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                      type="button"
                      onClick={onCancel}
                      className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || isAutofilling}
                      className="flex-1 sm:flex-none px-6 py-2.5 bg-black text-white font-semibold rounded-xl hover:bg-gray-850 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? "Menyimpan..." : (isAutofilling ? "Ekstraksi AI..." : (initialData ? "Simpan Perubahan" : "Simpan Sertifikat"))}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
