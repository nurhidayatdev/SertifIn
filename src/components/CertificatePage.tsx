import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Certificate, UserProfile } from "../types";
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Tag, 
  CheckCircle, 
  ShieldCheck, 
  Download, 
  Share2, 
  FileText, 
  Award,
  Globe
} from "lucide-react";

// Helper to convert Google Drive URL to embeddable preview format
const getPdfEmbedUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    let id = "";
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1 && m1[1]) {
      id = m1[1];
    } else {
      const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m2 && m2[1]) {
        id = m2[1];
      }
    }
    if (id) {
      return `https://drive.google.com/file/d/${id}/preview`;
    }
  }
  return url;
};

// Helper to convert Google Drive URL to a direct download URL
const getDownloadUrl = (url: string) => {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    let id = "";
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1 && m1[1]) {
      id = m1[1];
    } else {
      const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (m2 && m2[1]) {
        id = m2[1];
      }
    }
    if (id) {
      return `https://drive.google.com/uc?export=download&id=${id}`;
    }
  }
  return url;
};

export default function CertificatePage() {
  const { certId } = useParams<{ certId: string }>();
  const navigate = useNavigate();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [owner, setOwner] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!certId) return;

    const fetchCertAndOwner = async () => {
      try {
        setIsLoading(true);
        const certRef = doc(db, "certificates", certId);
        const certSnap = await getDoc(certRef);

        if (certSnap.exists()) {
          const certData = { id: certSnap.id, ...certSnap.data() } as Certificate;
          setCert(certData);

          // If cert has a userId, get owner profile
          if (certData.userId) {
            const userRef = doc(db, "users", certData.userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              setOwner({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
            }
          }
        } else {
          setErrorVisible(true);
        }
      } catch (err) {
        console.error("Error fetching certificate:", err);
        setErrorVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertAndOwner();
  }, [certId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!cert) return;
    const url = cert.credentialUrl || cert.imageUrl;
    if (!url) return;

    const certName = cert.title.replace(/[^a-zA-Z0-9\s-_()]/g, "").trim();
    const userName = (owner?.displayName || cert.userName || "User").replace(/[^a-zA-Z0-9\s-_()]/g, "").trim();
    const baseName = `${certName}_${userName}`;

    // Direct Google Drive direct download rewrite
    if (url.includes("drive.google.com")) {
      let id = "";
      const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (m1 && m1[1]) {
        id = m1[1];
      } else {
        const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (m2 && m2[1]) {
          id = m2[1];
        }
      }
      if (id) {
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = baseName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }
    }

    // Attempt direct blob download for CORS-enabled resources, otherwise fallback
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      
      // Determine file extension
      let ext = "pdf";
      if (cert.fileType) {
        ext = cert.fileType;
      } else if (url.includes(".png")) {
        ext = "png";
      } else if (url.includes(".jpg") || url.includes(".jpeg")) {
        ext = "jpg";
      }
      
      a.download = `${baseName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn("CORS/Fetch error when downloading directly, falling back to clean direct download anchor", err);
      const a = document.createElement("a");
      a.href = url;
      a.download = baseName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Profesional": "bg-blue-50 text-blue-700 border border-blue-100",
      "Kursus & Pelatihan": "bg-green-50 text-green-700 border border-green-100",
      "Magang": "bg-amber-50 text-amber-700 border border-amber-100",
      "Bahasa": "bg-indigo-50 text-indigo-700 border border-indigo-100",
      "Kompetisi": "bg-rose-50 text-rose-700 border border-rose-100",
      "Organisasi": "bg-purple-50 text-purple-700 border border-purple-100",
      "Seminar & Workshop": "bg-teal-50 text-teal-700 border border-teal-100",
      "Akademik": "bg-slate-50 text-slate-700 border border-slate-100"
    };
    return colors[category] || "bg-gray-50 text-gray-700 border border-gray-100";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-gray-500">Mengambil metadata sertifikat terverifikasi...</p>
      </div>
    );
  }

  if (errorVisible || !cert) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sertifikat Tidak Ditemukan</h1>
          <p className="text-gray-500 text-sm mb-6">
            Tautan verifikasi atau kode sertifikat mungkin salah, kedaluwarsa, atau telah dihapus oleh pemiliknya.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 bg-black text-white hover:bg-gray-900 font-semibold rounded-xl text-sm transition-colors shadow-sm"
          >
            Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    );
  }

  const linkedinAddUrl = (() => {
    const base = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME";
    const params = new URLSearchParams();
    params.append("name", cert.title);
    if (cert.issuingOrganization) params.append("organizationName", cert.issuingOrganization);
    if (cert.issueMonth) params.append("issueMonth", cert.issueMonth);
    if (cert.issueYear) params.append("issueYear", cert.issueYear);
    if (cert.hasExpiration) {
      if (cert.expirationMonth) params.append("expirationMonth", cert.expirationMonth);
      if (cert.expirationYear) params.append("expirationYear", cert.expirationYear);
    }
    // Point directly to this digital viewer page as credential Url
    params.append("certUrl", window.location.href);
    if (cert.credentialId) params.append("certId", cert.credentialId);
    
    return `${base}&${params.toString()}`;
  })();

  const portfolioUrl = owner ? `/u/${owner.username || owner.uid}` : `/u/${cert.userId}`;
  const isOwner = currentUser && cert && cert.userId === currentUser.uid;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      {/* Verification Top Banner */}
      <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm">
        <CheckCircle size={14} className="fill-white text-emerald-600" />
        Halaman Resmi Verifikasi Dokumen Kredensial Terotentikasi
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-grow w-full flex flex-col">
        {/* Navigation / Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <Link
            to={portfolioUrl}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors self-start"
          >
            <ArrowLeft size={16} />
            Kembali ke Galeri {owner?.displayName || cert.userName || "Pemilik"} 
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white text-gray-700 hover:text-black border border-gray-200 hover:border-gray-300 font-semibold text-xs rounded-lg transition-all shadow-sm"
            >
              <Share2 size={13.5} />
              {isCopied ? "Tautan Disalin!" : "Bagikan Halaman Verifikasi"}
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row overflow-hidden flex-grow min-h-[60vh]">
          {/* Left panel: Document Viewer / Canvas Frame */}
          <div className="w-full lg:w-3/5 bg-gray-100/50 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-gray-100 p-4 md:p-6 lg:p-8 min-h-[40vh] lg:min-h-0">
            {cert.fileType === 'pdf' ? (
              <iframe 
                src={getPdfEmbedUrl(cert.imageUrl)} 
                title={cert.title} 
                className="w-full aspect-[1.4142] max-h-[60vh] lg:max-h-[65vh] rounded-2xl border border-gray-200/60 shadow-md bg-white h-auto"
              />
            ) : cert.imageUrl ? (
              <div className="relative w-full h-full max-h-[65vh] flex items-center justify-center group">
                <img
                  src={cert.imageUrl}
                  alt={cert.title}
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-gray-100 bg-white"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <section className="text-gray-400 flex flex-col items-center py-12">
                <FileText size={48} className="mb-2" />
                <span className="font-semibold text-sm">Pratinjau tidak tersedia</span>
              </section>
            )}
          </div>

          {/* Right panel: Information details */}
          <div className="w-full lg:w-2/5 p-6 md:p-8 lg:p-10 flex flex-col bg-white">
            {/* Badges / Header details */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(cert.category)}`}>
                <Tag className="w-3.5 h-3.5 mr-1.5" />
                {cert.category}
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded-full text-xs font-semibold">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                {cert.date}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-6">
              {cert.title}
            </h1>

            {/* Official Green Verification Card */}
            <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-4 sm:p-5 mb-8 flex items-start gap-3.5">
              <div className="w-10 h-10 bg-emerald-100/80 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck size={22} className="stroke-[2.5]" />
              </div>
              <div className="text-sm">
                <h3 className="font-bold text-gray-900 mb-0.5">Kredensial Digital Terverifikasi</h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Sertifikat ini secara resmi diverifikasi oleh SertifIn sebagai dokumen otentik dan asli milik pemegang akun.
                </p>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="flex flex-col gap-5 text-sm p-5 border border-gray-100 rounded-2xl bg-gray-50/50 mb-8 self-stretch">
              {cert.issuingOrganization && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 justify-between border-b border-gray-100 pb-3">
                  <span className="font-bold text-gray-700 uppercase text-[11px] tracking-wider">Penerbit (Issuing Org)</span>
                  <span className="text-gray-900 font-semibold">{cert.issuingOrganization}</span>
                </div>
              )}
              
              {cert.credentialId && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 justify-between border-b border-gray-100 pb-3">
                  <span className="font-bold text-gray-700 uppercase text-[11px] tracking-wider">ID Kredensial / No. Seri</span>
                  <span className="text-gray-950 font-mono text-xs bg-white px-2 py-1 border rounded-lg font-bold shadow-sm">{cert.credentialId}</span>
                </div>
              )}

              {(cert.issueMonth || cert.issueYear) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 justify-between border-b border-gray-100 pb-3">
                  <span className="font-bold text-gray-700 uppercase text-[11px] tracking-wider">Tanggal Penerbitan</span>
                  <span className="text-gray-800 font-medium">
                    {cert.issueMonth && `${cert.issueMonth}/`}{cert.issueYear || ""}
                    {cert.hasExpiration ? (
                      <span className="text-amber-700 font-semibold"> (Bisa Kedaluwarsa s.d. {cert.expirationMonth && `${cert.expirationMonth}/`}{cert.expirationYear || ""})</span>
                    ) : (
                      <span className="text-gray-400 italic"> (Tanpa Kedaluwarsa)</span>
                    )}
                  </span>
                </div>
              )}

              {(owner?.displayName || cert.userName) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 justify-between">
                  <span className="font-bold text-gray-700 uppercase text-[11px] tracking-wider">Pemilik Sertifikat</span>
                  <span className="text-gray-900 font-semibold">
                    {owner?.displayName || cert.userName}
                  </span>
                </div>
              )}
            </div>

            {/* Skills */}
            {cert.skills && cert.skills.trim().length > 0 && (
              <div className="mb-8">
                <span className="block font-bold text-gray-700 uppercase text-[11px] tracking-wider mb-2.5">Keahlian (Skills)</span>
                <div className="flex flex-wrap gap-2">
                  {cert.skills.split(",").map((s, idx) => {
                    const trimmed = s.trim();
                    if (!trimmed) return null;
                    return (
                      <span key={idx} className="bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-lg border border-blue-100 flex items-center transition-all">
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Major Action Buttons */}
            {isOwner ? (
              <div className="mt-auto flex flex-col gap-3">
                {cert.credentialUrl ? (
                  <button
                    onClick={handleDownload}
                    className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-black hover:bg-gray-900 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
                  >
                    <Download size={16} />
                    Unduh Berkas Asli
                  </button>
                ) : null}

                <a
                  href={linkedinAddUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex justify-center items-center gap-2.5 px-6 py-3.5 bg-[#0077b5] hover:bg-[#006294] text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  Tambahkan ke Profil LinkedIn
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
