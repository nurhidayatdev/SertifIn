import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from "react-router-dom";
import { Header } from "./components/Header";
import { CertificateCard } from "./components/CertificateCard";
import { CertificateModal } from "./components/CertificateModal";
import { AdminForm } from "./components/AdminForm";
import { ProfileSettingsModal } from "./components/ProfileSettingsModal";
import CertificatePage from "./components/CertificatePage";
import { Certificate, CATEGORIES } from "./types";
import { db, googleSignIn, logout, initAuth, getAccessToken } from "./firebase";
import { collection, query, orderBy, where, onSnapshot, getDoc, doc, getDocs, deleteDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { DatabaseView } from "./components/DatabaseView";
import { Database, LayoutGrid, Award, Copy, Check, X, Share2 } from "lucide-react";

const getDriveId = (url?: string) => {
  if (!url) return null;
  if (url.includes("drive.google.com")) {
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (m1 && m1[1]) return m1[1];
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m2 && m2[1]) return m2[1];
  }
  return null;
};

function Vault() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isForceFill, setIsForceFill] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopiedShare, setIsCopiedShare] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && user) {
      const checkProfileCompleteness = async () => {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (!docSnap.exists() || !docSnap.data().username || !docSnap.data().displayName) {
            setIsForceFill(true);
            setIsSettingsVisible(true);
          } else {
            setIsForceFill(false);
          }
        } catch (error) {
          console.error("Error checking profile completeness:", error);
        }
      };
      checkProfileCompleteness();
    } else {
      setIsForceFill(false);
    }
  }, [user, isAuthLoading]);
  const [certToEdit, setCertToEdit] = useState<Certificate | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState("");
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [resolvedUid, setResolvedUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setIsAuthLoading(false);
        if (!userId && currentUser) {
          getDoc(doc(db, "users", currentUser.uid))
            .then((docSnap) => {
              if (docSnap.exists() && docSnap.data().username) {
                navigate(`/u/${docSnap.data().username}`, { replace: true });
              } else {
                navigate(`/u/${currentUser.uid}`, { replace: true });
              }
            })
            .catch(() => {
              navigate(`/u/${currentUser.uid}`, { replace: true });
            });
        }
      },
      () => {
        setUser(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribeAuth();
  }, [userId, navigate]);

  useEffect(() => {
    if (!userId) {
      if (!isAuthLoading && !user) {
        setIsLoading(false);
      }
      return;
    }
    
    setIsLoading(true);
    let unsubscribe = () => {};
    
    const fetchVault = async () => {
      try {
        let targetUid = userId;
        let pName = null;
        
        // Fast path: try as UID first
        const docSnap = await getDoc(doc(db, "users", userId));
        if (docSnap.exists()) {
           targetUid = docSnap.data().uid;
           pName = docSnap.data().displayName;
           
           // Redirect to custom username if it exists to keep URL clean
           const customUsername = docSnap.data().username;
           if (customUsername && userId === targetUid) {
             navigate(`/u/${customUsername}`, { replace: true });
             return;
           }
        } else {
           // Try as username
           const qUser = query(collection(db, "users"), where("username", "==", userId));
           const qr = await getDocs(qUser);
           if (!qr.empty) {
             targetUid = qr.docs[0].data().uid;
             pName = qr.docs[0].data().displayName;
           }
        }
        
        setResolvedUid(targetUid);
        if (pName) setOwnerName(pName);

        const q = query(
          collection(db, "certificates"),
          where("userId", "==", targetUid),
          orderBy("createdAt", "desc")
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const certsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Certificate[];
          setCertificates(certsData);
          if (certsData.length > 0 && certsData[0].userName && !pName) {
            setOwnerName(certsData[0].userName);
          }
          setIsLoading(false);
          setErrorInfo("");
        }, (error) => {
          console.error("Firebase error details:", error);
          setErrorInfo("Gagal mengambil data sertifikat.");
          setIsLoading(false);
        });
      } catch (e: any) {
        console.error(e);
        setErrorInfo("Pencarian Firebase gagal.");
        setIsLoading(false);
      }
    };

    fetchVault();
    
    return () => unsubscribe();
  }, [userId, isAuthLoading, user]);

  const filteredCerts = certificates
    .filter(cert => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        cert.title.toLowerCase().includes(searchLower) ||
        (cert.issuingOrganization || "").toLowerCase().includes(searchLower) ||
        (cert.skills || "").toLowerCase().includes(searchLower) ||
        (cert.category || "").toLowerCase().includes(searchLower) ||
        (cert.credentialId || "").toLowerCase().includes(searchLower) ||
        (cert.description || "").toLowerCase().includes(searchLower);

      const matchesCategory = 
        selectedCategory === "Semua" ? true :
        selectedCategory === "Unggulan" ? cert.isFeatured === true :
        cert.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) {
        return dateB - dateA; // descending (newest first)
      }
      
      const yearA = parseInt(a.issueYear || "0", 10);
      const yearB = parseInt(b.issueYear || "0", 10);
      if (yearA !== yearB) {
        return yearB - yearA;
      }
      
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

  const handleLogin = async () => {
    try {
      await googleSignIn();
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error?.code === 'auth/popup-blocked') {
        alert("Popup login Google diblokir oleh browser Anda. Izinkan popup atau buka aplikasi ini di tab baru.");
      } else if (error?.code === 'auth/popup-closed-by-user') {
        // User closed, ignore
      } else if (error?.code === 'auth/unauthorized-domain') {
        alert("Domain ini belum diotorisasi untuk OAuth. Silakan periksa pengaturan Firebase Anda.");
      } else {
        alert("Gagal masuk dengan Google. Jika Anda berada di dalam iframe, coba buka aplikasi di tab baru.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDelete = async (certId: string) => {
    try {
      const cert = certificates.find(c => c.id === certId);
      if (cert) {
        const driveId = getDriveId(cert.credentialUrl) || getDriveId(cert.imageUrl);
        if (driveId) {
          try {
            let accessToken = await getAccessToken();
            if (!accessToken) {
              const res = await googleSignIn();
              if (res) {
                accessToken = res.accessToken;
              }
            }
            if (accessToken) {
              const driveDeleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              if (driveDeleteRes.status === 401) {
                const res = await googleSignIn();
                if (res) {
                  await fetch(`https://www.googleapis.com/drive/v3/files/${driveId}`, {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${res.accessToken}`,
                    },
                  });
                }
              }
              console.log("File di Google Drive berhasil dihapus.");
            }
          } catch (driveErr) {
            console.error("Error deleting file from Google Drive:", driveErr);
          }
        }
      }

      await deleteDoc(doc(db, "certificates", certId));
      setSelectedCert(null);
    } catch (error) {
      console.error("Failed to delete:", error);
      alert("Gagal menghapus sertifikat");
      throw error;
    }
  };

  const handleEdit = (cert: Certificate) => {
    setSelectedCert(null);
    setCertToEdit(cert);
    setIsAdminVisible(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOwner = user && (userId === user.uid || resolvedUid === user.uid);

  if (!userId && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-md flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mb-6 shadow-md">
            <Award className="w-10 h-10 text-yellow-400 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-1 justify-center">
            Sertif<span className="text-blue-600">In</span>
          </h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">Masuk dengan Google untuk membuat dan membagikan kredensial serta sertifikat digital Anda yang aman.</p>
          <button onClick={handleLogin} className="gsi-material-button">
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper">
              <div className="gsi-material-button-icon">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents">Masuk dengan Google</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col min-h-screen">
        <Header 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isAdminVisible={isAdminVisible}
          onAdminToggle={() => {
            setIsAdminVisible(!isAdminVisible);
            if (!isAdminVisible) setCertToEdit(null);
          }}
          onLogout={handleLogout}
          onLogin={handleLogin}
          user={user}
          isOwner={isOwner}
          onSettings={() => setIsSettingsVisible(true)}
        />

         {isSettingsVisible && user && (
          <ProfileSettingsModal 
            user={user} 
            onClose={() => {
              setIsSettingsVisible(false);
              setIsForceFill(false);
            }} 
            isForceFill={isForceFill}
          />
        )}

        {userId && (
          <div className="mb-5 p-6 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{isOwner ? "Galeri Sertifikat Saya" : `Galeri ${ownerName || "Pengguna"}`}</h2>
              <p className="text-sm text-gray-500 mt-1">Galeri ini bersifat publik. Siapa pun yang memiliki tautan dapat melihat sertifikat ini.</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium font-sans">Tautan Publik:</span>
                <span className="text-xs text-blue-600 font-mono font-semibold bg-blue-50/50 px-2 py-1 rounded border border-blue-100/50 select-all">
                  {window.location.origin}/u/{userId}
                </span>
              </div>
            </div>
            {isOwner && (
              <button 
                onClick={() => {
                  setIsShareModalOpen(true);
                  setIsCopiedShare(false);
                }}
                className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow-md"
              >
                <Share2 className="w-4 h-4" />
                Bagikan Profil
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 flex-grow">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-6">
            {/* Total Certificate Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-100/70 rounded-2xl p-5 shadow-sm">
              <div className="text-[10px] font-extrabold text-blue-700/80 uppercase tracking-widest">Total Sertifikat</div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 tracking-tight">{certificates.length}</span>
                <span className="text-xs font-semibold text-blue-700">Berkas</span>
              </div>
              <p className="text-[11px] text-blue-600/70 mt-1 leading-relaxed">
                Kredensial Anda terverifikasi dan aman di dalam Google Drive Anda.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-extrabold text-gray-900 mb-4 text-sm uppercase tracking-wider text-gray-500">Daftar Kategori</h2>
              <div className="flex flex-col space-y-1.5">
                <button
                  onClick={() => setSelectedCategory("Semua")}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left group ${
                    selectedCategory === "Semua" ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                  }`}
                >
                  <span>Semua Kategori</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                    selectedCategory === "Semua" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                  }`}>
                    {certificates.length}
                  </span>
                </button>
                <button
                  onClick={() => setSelectedCategory("Unggulan")}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left group ${
                    selectedCategory === "Unggulan" ? "bg-amber-600 text-white" : "text-amber-600 hover:bg-amber-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <span>⭐</span> Unggulan
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                    selectedCategory === "Unggulan" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700 group-hover:bg-amber-200"
                  }`}>
                    {certificates.filter(cert => cert.isFeatured === true).length}
                  </span>
                </button>
                {CATEGORIES.map((cat) => {
                  const count = certificates.filter(cert => cert.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left group ${
                        selectedCategory === cat ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
                      }`}
                    >
                      <span className="truncate mr-2">{cat}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors ${
                        selectedCategory === cat ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col gap-6 min-w-0">
            {isOwner && isAdminVisible && (
              <AdminForm 
                onSuccess={() => { setIsAdminVisible(false); setCertToEdit(null); }} 
                onCancel={() => { setIsAdminVisible(false); setCertToEdit(null); }}
                user={user}
                initialData={certToEdit || undefined}
              />
            )}

            {errorInfo && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 border border-red-100">
                {errorInfo}
              </div>
            )}

            {/* View Mode Switching Tabs */}
            {isOwner && (
              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
                <div className="flex gap-4">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1.5 pb-2 text-sm font-extrabold border-b-2 transition-all ${
                      viewMode === "grid"
                        ? "border-black text-black"
                        : "border-transparent text-gray-400 hover:text-black"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Galeri Kredensial</span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1.5 pb-2 text-sm font-extrabold border-b-2 transition-all ${
                      viewMode === "table"
                        ? "border-black text-black"
                        : "border-transparent text-gray-400 hover:text-black"
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>Tabel Database</span>
                  </button>
                </div>
              </div>
            )}

            {viewMode === "table" && isOwner ? (
              <DatabaseView 
                certificates={certificates}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={(cert) => navigate(`/c/${cert.id}`)}
                onAddNew={() => {
                  setCertToEdit(null);
                  setIsAdminVisible(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isOwner={isOwner || false}
              />
            ) : isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col">
                     <div className="h-48 bg-gray-100 rounded-lg animate-pulse mb-4"></div>
                     <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4 mb-2"></div>
                     <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredCerts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCerts.map((cert) => (
                  <CertificateCard 
                    key={cert.id} 
                    cert={cert} 
                    onClick={() => navigate(`/c/${cert.id}`)} 
                  />
                ))}
              </div>
            ) : !errorInfo && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum ada sertifikat di sini</h3>
                <p className="text-sm text-gray-500">{isOwner ? "Unggah sertifikat pertama Anda untuk memulai." : "Pengguna ini belum mengunggah sertifikat apa pun."}</p>
              </div>
            )}
          </main>
        </div>
        
        <footer className="mt-8 py-4 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>SertifIn &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>

      <CertificateModal 
        cert={selectedCert} 
        onClose={() => setSelectedCert(null)} 
        isOwner={isOwner}
        onDelete={handleDelete}
        onEdit={() => selectedCert && handleEdit(selectedCert)}
      />

      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Share2 className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-gray-950 font-sans">Bagikan Profil Publik</h3>
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-all font-sans"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <p className="text-sm text-gray-600 leading-relaxed mb-4 font-sans">
                Gunakan tautan di bawah ini untuk membagikan galeri sertifikat digital publik Anda kepada rekan kerja, perekrut, atau unggah ke CV.
              </p>

              {/* Tautan Input */}
              <div className="relative flex items-center mb-5 bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-sm">
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/u/${userId}`}
                  className="w-full pl-3 pr-28 py-2 text-xs font-semibold font-mono text-blue-700 bg-transparent border-none focus:outline-none select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/u/${userId}`);
                    setIsCopiedShare(true);
                    setTimeout(() => setIsCopiedShare(false), 2000);
                  }}
                  className={`absolute right-1 px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all text-white shadow ${
                    isCopiedShare 
                      ? "bg-green-600 hover:bg-green-700 font-sans" 
                      : "bg-blue-600 hover:bg-blue-700 font-sans"
                  }`}
                >
                  {isCopiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Link
                    </>
                  )}
                </button>
              </div>

              {/* Tips */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2 font-sans">
                <div className="font-bold shrink-0">💡 Info:</div>
                <p className="leading-relaxed">
                  Semua berkas sertifikat Anda yang disimpan di Google Drive akan tetap diakses secara aman sesuai izin akses drive publik yang diatur.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-sm font-semibold rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-sans"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/c/:certId" element={<CertificatePage />} />
        <Route path="/u/:userId" element={<Vault />} />
        <Route path="/" element={<Vault />} />
      </Routes>
    </Router>
  );
}

