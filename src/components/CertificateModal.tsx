import React, { useEffect, useState } from "react";
import { Certificate } from "../types";
import { X, ExternalLink, Calendar, Tag, Trash2, Pencil } from "lucide-react";

interface CertificateModalProps {
  cert: Certificate | null;
  onClose: () => void;
  isOwner?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onEdit?: () => void;
}

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

export function CertificateModal({ cert, onClose, isOwner, onDelete, onEdit }: CertificateModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!cert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-white w-full max-w-5xl max-h-full rounded-2xl shadow-2xl overflow-hidden z-10 relative flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur text-gray-600 p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors z-20 shadow-sm"
          aria-label="Close"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        <div className="w-full md:w-3/5 bg-gray-50 flex flex-col items-center justify-center p-4 md:p-6 relative border-r border-gray-100 min-h-[40vh] md:min-h-0 self-stretch">
          {cert.fileType === 'pdf' ? (
            <iframe 
              src={getPdfEmbedUrl(cert.imageUrl)} 
              title={cert.title} 
              className="w-full aspect-[1.4142] max-h-[50vh] md:max-h-[60vh] border-0 bg-white rounded-2xl shadow-md h-auto"
            />
          ) : cert.imageUrl ? (
            <img
              src={cert.imageUrl}
              alt={cert.title}
              className="w-full h-full object-contain p-4 md:p-8"
            />
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span className="font-medium">Pratinjau tidak tersedia</span>
            </div>
          )}
        </div>

        <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col bg-white overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
               <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                <Tag className="w-3 h-3 mr-1.5" />
                {cert.category}
              </span>
               <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                <Calendar className="w-3 h-3 mr-1.5" />
                {cert.date}
              </span>
              {cert.isFeatured && (
                 <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                   Unggulan
                 </span>
              )}
            </div>
             {isOwner && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button 
                    onClick={onEdit}
                    className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                    title="Ubah Sertifikat"
                  >
                    <Pencil size={18} />
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={async () => {
                       if (window.confirm("Apakah Anda yakin ingin menghapus sertifikat ini?")) {
                         setIsDeleting(true);
                         try {
                           await onDelete(cert.id!);
                         } catch (e) {
                           setIsDeleting(false);
                         }
                       }
                    }}
                    disabled={isDeleting}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                    title="Hapus Sertifikat"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-4">
            {cert.title}
          </h2>

          {/* LinkedIn Metadata Display */}
          {(cert.issuingOrganization || cert.credentialId || cert.skills) && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex flex-col gap-3 text-sm border border-gray-100">
              {cert.issuingOrganization && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 min-w-[120px]">Penerbit:</span>
                  <span className="text-gray-600 font-medium">{cert.issuingOrganization}</span>
                </div>
              )}
              {cert.credentialId && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 min-w-[120px]">ID Kredensial:</span>
                  <span className="text-gray-600 font-mono text-xs bg-white px-1.5 py-0.5 border rounded">{cert.credentialId}</span>
                </div>
              )}
              {(cert.issueMonth || cert.issueYear) && (
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 min-w-[120px]">Masa Berlaku:</span>
                  <span className="text-gray-600">
                    {cert.issueMonth && `${cert.issueMonth}/`}{cert.issueYear || ""}
                    {cert.hasExpiration ? (
                      <span> s.d. {cert.expirationMonth && `${cert.expirationMonth}/`}{cert.expirationYear || ""}</span>
                    ) : (
                      <span className="text-gray-400 italic"> (Tanpa Kedaluwarsa)</span>
                    )}
                  </span>
                </div>
              )}
              {cert.skills && (
                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-gray-200">
                  <span className="font-semibold text-gray-700">Keahlian (Skills):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cert.skills.split(",").map((s, idx) => {
                      const trimmed = s.trim();
                      if (!trimmed) return null;
                      return (
                        <span key={idx} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded border border-blue-100">
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}


          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
            {cert.credentialUrl ? (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all"
              >
                Verifikasi Kredensial <ExternalLink size={16} />
              </a>
            ) : (
              <button 
                disabled
                 className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 text-sm font-medium rounded-lg border border-gray-200 cursor-not-allowed"
              >
                Tanpa Tautan Verifikasi
              </button>
            )}

            {/* LinkedIn direct-add certification button */}
            <a
              href={(() => {
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
                params.append("certUrl", `${window.location.origin}/c/${cert.id}`);
                
                if (cert.credentialId) params.append("certId", cert.credentialId);
                
                return `${base}&${params.toString()}`;
              })()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-[#0077b5] text-white text-sm font-semibold rounded-lg hover:bg-[#006294] focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
              Tambahkan ke Profil LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
