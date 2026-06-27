import React from "react";
import { LogOut, User as UserIcon, Settings, Award } from "lucide-react";
import { User } from "firebase/auth";
import { Link } from "react-router-dom";

interface HeaderProps {
  onLogout: () => void;
  onLogin: () => void;
  user: User | null;
  isOwner?: boolean;
  onSettings?: () => void;
}

export function Header({
  onLogout,
  onLogin,
  user,
  isOwner,
  onSettings,
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center py-4 mb-2 gap-4 border-b border-gray-200">
      <div className="flex items-center gap-3 self-start sm:self-auto">
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

      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
        {user ? (
          <>
            {isOwner ? (
              <button
                onClick={onSettings}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                title="Pengaturan Profil"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Pengaturan</span>
              </button>
            ) : (
              <Link
                to={`/u/${user.uid}`}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              >
                <UserIcon className="w-4 h-4" /> 
                <span className="hidden sm:inline">Galeri Saya</span>
              </Link>
            )}
            
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
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
    </header>
  );
}
