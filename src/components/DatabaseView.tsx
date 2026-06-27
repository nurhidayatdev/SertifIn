import React, { useState } from "react";
import { 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  Copy, 
  Check, 
  Award, 
  Calendar, 
  Tag, 
  SlidersHorizontal,
  PlusCircle,
  Eye,
  Trash,
  AlertCircle,
  FileText
} from "lucide-react";
import { Certificate, CATEGORIES } from "../types";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

// Helper to convert Google Drive URL to thumbnail format
const getDisplayImageUrl = (cert: Certificate) => {
  if (cert.fileType === 'pdf' && cert.imageUrl?.includes('drive.google.com')) {
    const match = cert.imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w300`;
    }
  }
  return cert.imageUrl;
};

interface DatabaseViewProps {
  certificates: Certificate[];
  onEdit: (cert: Certificate) => void;
  onDelete: (certId: string) => Promise<void>;
  onView: (cert: Certificate) => void;
  onAddNew: () => void;
  isOwner: boolean;
}

export function DatabaseView({
  certificates,
  onEdit,
  onDelete,
  onView,
  onAddNew,
  isOwner
}: DatabaseViewProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleCopy = (txt: string, certId: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = (id: string) => {
    setIdToDelete(id);
  };

  const handleConfirmDelete = async () => {
    if (!idToDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(idToDelete);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
      setIdToDelete(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Controls Header */}
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            Database Hub Kredensial
            <span className="text-xs font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-md">{certificates.length} Sertifikat</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Kelola data seluruh sertifikasi Anda dalam bentuk tabel tabular interaktif.</p>
        </div>
      </div>

      {/* Table & Mobile Card Layout wrapper */}
      <div className="overflow-x-auto">
        {/* Responsive Table for md+ screens */}
        <table className="w-full text-left border-collapse hidden md:table">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Nama Sertifikat</th>
              <th className="px-6 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Penerbit</th>
              <th className="px-6 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Keahlian (Skills)</th>
              <th className="px-6 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider">Kredensial ID</th>
              <th className="px-6 py-3.5 text-xs font-black text-gray-500 uppercase tracking-wider text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {certificates.length > 0 ? (
              certificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50/40 transition-colors">
                  {/* Title & Category */}
                  <td className="px-6 py-4 min-w-[200px] max-w-[300px] lg:max-w-md break-words">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 border border-gray-100 rounded-lg overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                        {cert.imageUrl && !imageErrors[cert.id || ""] ? (
                          <img 
                            src={getDisplayImageUrl(cert)} 
                            alt={cert.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            onError={() => {
                              if (cert.id) {
                                setImageErrors((prev) => ({ ...prev, [cert.id]: true }));
                              }
                            }}
                          />
                        ) : cert.fileType === "pdf" ? (
                          <FileText className="w-5 h-5 text-red-500" />
                        ) : (
                          <Award className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm text-gray-900 leading-tight break-words hover:text-blue-600 transition-colors">
                          {cert.title}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {cert.category}
                          </span>
                          {cert.fileType === 'pdf' && (
                            <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded whitespace-nowrap">
                              PDF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Publisher / Org */}
                  <td className="px-6 py-4 min-w-[150px] max-w-[200px] break-words">
                    <div className="text-xs sm:text-sm font-semibold text-gray-800 break-words">
                      {cert.issuingOrganization || "-"}
                    </div>
                    {(cert.issueMonth || cert.issueYear) && (
                      <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>
                          {cert.issueMonth} {cert.issueYear}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Skills tags */}
                  <td className="px-6 py-4">
                    {cert.skills ? (
                      <div className="flex flex-wrap gap-1 max-w-[200px] lg:max-w-[280px]">
                        {cert.skills.split(",").map((sk, idx) => (
                          <span 
                            key={idx} 
                            className="text-[10px] font-semibold text-blue-800 bg-blue-50/70 px-2 py-0.5 rounded border border-blue-100/30 whitespace-nowrap"
                          >
                            {sk.trim()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-405 italic">-</span>
                    )}
                  </td>

                  {/* Credential info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {cert.credentialId ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-gray-600 truncate max-w-[120px]">
                          {cert.credentialId}
                        </span>
                        <button
                          onClick={() => handleCopy(cert.credentialId || "", cert.id || "")}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-all"
                          title="Salin ID Kredensial"
                        >
                          {copiedId === cert.id ? (
                            <Check className="w-3 H-3 text-green-600 animate-pulse" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">-</span>
                    )}

                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1 font-semibold"
                      >
                        <span>Tautan Verifikasi</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </td>

                  {/* Actions column */}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView(cert)}
                        className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-900 rounded-lg transition-all"
                        title="Lihat Pratinjau"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isOwner && (
                        <>
                          <button
                            onClick={() => onEdit(cert)}
                            className="p-1.5 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-all"
                            title="Ubah Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cert.id && confirmDelete(cert.id)}
                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                  Tidak ada data sertifikat yang cocok dengan pencarian Anda.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Responsive Mobile cards for max-md screen size */}
        <div className="block md:hidden divide-y divide-gray-100 p-4 space-y-4">
          {certificates.length > 0 ? (
            certificates.map((cert) => (
              <div key={cert.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3 shadow-inner">
                {/* Header card info */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 border border-gray-250 rounded-xl overflow-hidden shrink-0 bg-white flex items-center justify-center">
                    {cert.imageUrl && !imageErrors[cert.id || ""] ? (
                      <img 
                        src={getDisplayImageUrl(cert)} 
                        alt={cert.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={() => {
                          if (cert.id) {
                            setImageErrors((prev) => ({ ...prev, [cert.id]: true }));
                          }
                        }}
                      />
                    ) : cert.fileType === "pdf" ? (
                      <FileText className="w-6 h-6 text-red-500" />
                    ) : (
                      <Award className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-gray-900 leading-tight break-words">
                      {cert.title}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-500 bg-white/80 border border-gray-100 px-2 py-0.5 rounded-full">
                        {cert.category}
                      </span>
                      {cert.fileType === 'pdf' && (
                        <span className="text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.2 rounded">
                          PDF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Body Meta Details */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-2.5">
                  <div>
                    <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Organisasi Penerbit</div>
                    <div className="font-semibold text-gray-900 mt-0.5 truncate">{cert.issuingOrganization || "-"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tanggal Terbit</div>
                    <div className="font-semibold text-gray-900 mt-0.5 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                      <span className="truncate">{cert.issueMonth ? `${cert.issueMonth} ${cert.issueYear}` : (cert.date || "-")}</span>
                    </div>
                  </div>
                </div>

                {/* Skills wrap tags */}
                {cert.skills && (
                  <div className="border-t border-gray-100 pt-2.5">
                    <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Keahlian</div>
                    <div className="flex flex-wrap gap-1">
                      {cert.skills.split(",").map((sk, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] font-bold text-blue-800 bg-white border border-blue-50 px-2 py-0.5 rounded"
                        >
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom interactive links & ID copies */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-150 pt-2.5">
                  <div className="flex flex-col">
                    {cert.credentialId && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-medium text-gray-500 font-mono">ID: {cert.credentialId}</span>
                        <button
                          onClick={() => handleCopy(cert.credentialId || "", cert.id || "")}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400"
                        >
                          {copiedId === cert.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <span>Tautan Verifikasi</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>

                  {/* Actions group */}
                  <div className="flex items-center gap-1.5 self-end">
                    <button
                      onClick={() => onView(cert)}
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-gray-250 text-gray-700 font-semibold text-xs gap-1 hover:bg-gray-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => onEdit(cert)}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs gap-1 hover:bg-blue-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Ubah</span>
                        </button>
                        <button
                          onClick={() => cert.id && confirmDelete(cert.id)}
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs gap-1 hover:bg-red-100"
                        >
                          <Trash2 className="w-3.5 h-3.5 animate-pulse-subtle" />
                          <span>Hapus</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-gray-400 text-xs">
              Tidak ada data sertifikat yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>
      </div>
    </div>

    <DeleteConfirmModal 
      isOpen={!!idToDelete}
        title="Hapus Sertifikat"
        description="Apakah Anda yakin ingin menghapus sertifikat ini? Tindakan ini tidak dapat dibatalkan, dan jika file disimpan di Google Drive maka file tersebut juga akan dihapus secara permanen."
        isDeleting={isDeleting}
        onClose={() => setIdToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
