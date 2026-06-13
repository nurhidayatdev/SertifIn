import React from "react";
import { Search, Plus, LogOut, User as UserIcon, Settings, Award } from "lucide-react";
import { User } from "firebase/auth";
import { Link } from "react-router-dom";

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onAdminToggle: () => void;
  isAdminVisible: boolean;
  onLogout: () => void;
  onLogin: () => void;
  user: User | null;
  isOwner?: boolean;
  onSettings?: () => void;
}

export function Header({
  searchQuery,
  setSearchQuery,
  onAdminToggle,
  isAdminVisible,
  onLogout,
  onLogin,
  user,
  isOwner,
  onSettings,
}: HeaderProps) {
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 mb-5 gap-6 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <div className="bg-black text-white p-2.5 rounded-xl flex items-center justify-center shadow-md">
          <Award className="w-6 h-6 text-yellow-400 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-1 font-sans">
            Sertif<span className="text-blue-600">In</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Kelola dan lihat pencapaian Anda</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        <div className="relative flex items-center w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari sertifikat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {user ? (
            <>
              {isOwner ? (
                <>
                  <button
                    onClick={onSettings}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex-none border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    title="Pengaturan Profil"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onAdminToggle}
                    className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none ${isAdminVisible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
                  >
                    {isAdminVisible ? (
                      "Tutup Formulir"
                    ) : (
                      <>
                        <Plus className="w-4 h-4" /> Baru
                      </>
                    )}
                  </button>
                </>
              ) : (
                <Link
                  to={`/u/${user.uid}`}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 sm:flex-none border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <UserIcon className="w-4 h-4" /> Galeri Saya
                </Link>
              )}
              
              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex-none"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button onClick={onLogin} className="gsi-material-button">
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
          )}
        </div>
      </div>
    </header>
  );
}
