import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { User } from "firebase/auth";
import { db } from "../firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { UserProfile } from "../types";
import { useNavigate } from "react-router-dom";

export function ProfileSettingsModal({ 
  user, 
  onClose,
  isForceFill = false
}: { 
  user: User, 
  onClose: () => void,
  isForceFill?: boolean
}) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          setUsername(profile.username || "");
          setDisplayName((profile.displayName || user.displayName || "").replace(/[^a-zA-Z\s]/g, "").toUpperCase());
        } else {
          setDisplayName((user.displayName || "").replace(/[^a-zA-Z\s]/g, "").toUpperCase());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();

    if (cleanUsername.length < 4) {
      setError("Tautan profil harus memiliki panjang minimal 4 karakter.");
      return;
    }

    if (!/^[a-z0-9-]+$/.test(cleanUsername)) {
      setError("Tautan profil hanya boleh menggunakan huruf kecil, angka, serta simbol hubung (-).");
      return;
    }

    if (!/^[a-z]/.test(cleanUsername)) {
      setError("Angka dan simbol tidak boleh di awal tautan profil. Harus dimulai dengan huruf kecil.");
      return;
    }

    if (!/[a-z0-9]$/.test(cleanUsername)) {
      setError("Simbol tidak boleh di akhir tautan profil.");
      return;
    }
    
    if (!cleanDisplayName) {
      setError("Nama Pemilik tidak boleh kosong.");
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Check if username is already taken by someone else
      const q = query(collection(db, "users"), where("username", "==", cleanUsername));
      const querySnapshot = await getDocs(q);
      const isTaken = !querySnapshot.empty && querySnapshot.docs.some(d => d.id !== user.uid);
      
      if (isTaken) {
         setError("Username ini sudah digunakan. Silakan pilih username lain.");
         setIsSaving(false);
         return;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: cleanUsername,
        displayName: cleanDisplayName,
      }, { merge: true });

      setSuccess("Profil berhasil diperbarui!");
      navigate(`/u/${cleanUsername}`, { replace: true });
      setTimeout(() => onClose(), 1500);
    } catch (e: any) {
      console.error(e);
      setError("Gagal menyimpan. Silakan coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-gray-950/55 backdrop-blur-[4px]" 
        onClick={() => {
          if (!isForceFill) onClose();
        }}
      />
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 z-10 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Lengkapi Profil Anda</h2>
            {isForceFill && (
              <p className="text-xs text-blue-600 font-medium mt-0.5 animate-pulse">Langkah wajib sebelum menggunakan aplikasi</p>
            )}
          </div>
          {!isForceFill && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-900 p-1.5 hover:bg-gray-50 rounded-lg transition-colors">
              <X size={20} />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSave} className="p-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ) : (
            <>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Nama Pemilik Sertifikat (Sesuai KTP/Ijazah)
                  </label>
                  <input 
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      const uppercaseNoNumSymbol = e.target.value.replace(/[^a-zA-Z\s]/g, "").toUpperCase();
                      setDisplayName(uppercaseNoNumSymbol);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-bold tracking-wide"
                    placeholder="CONTOH: NUR HIDAYAT"
                    required
                  />
                  <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                    Nama ini akan digunakan secara otomatis pada halaman kredensial Anda.
                  </p>
                  <p className="text-[10px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                    <span>⚠️</span> Hanya menerima karakter huruf (A-Z) dan spasi (tanpa angka/simbol).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Tautan dan Nama Alias Profil
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3 py-2.5 text-sm text-gray-400 font-mono select-none">
                      /u/
                    </span>
                    <input 
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase())}
                      className="flex-1 w-full border border-gray-300 rounded-r-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      placeholder="nurhidayat"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-gray-450 mt-1.5 leading-relaxed">
                    Alamat web unik portofolio Anda: <span className="font-mono text-gray-600 bg-gray-50 px-1 rounded">{window.location.origin}/u/{username || "nurhidayat"}</span>
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-gray-500 font-medium">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Min. 4 Karakter</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Awal: Harus Huruf Kecil</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Akhir: Bukan Simbol (-)</span>
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Huruf Kecil, Angka, Simbol (-)</span>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}
              {success && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg text-green-700 text-xs font-semibold leading-relaxed">
                  {success}
                </div>
              )}
              
              <div className="mt-6 flex justify-end gap-3 border-t border-gray-50 pt-4">
                {!isForceFill && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSaving || !username || !displayName}
                  className="px-5 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Profil"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
