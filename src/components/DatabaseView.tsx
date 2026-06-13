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
  AlertCircle
} from "lucide-react";
import { Certificate, CATEGORIES } from "../types";

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
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("Semua");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // Filter & Sort logic
  const filtered = certificates
    .filter((cert) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        cert.title.toLowerCase().includes(searchLower) ||
        (cert.issuingOrganization || "").toLowerCase().includes(searchLower) ||
        (cert.skills || "").toLowerCase().includes(searchLower) ||
        (cert.category || "").toLowerCase().includes(searchLower) ||
        (cert.credentialId || "").toLowerCase().includes(searchLower) ||
        (cert.description || "").toLowerCase().includes(searchLower);
      
      const matchesCategory = selectedCat === "Semua" || cert.category === selectedCat;
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

  const handleCopy = (txt: string, certId: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedId(certId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus sertifikat ini?")) {
      try {
        await onDelete(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Controls Header */}
      <div className="p-5 md:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Database Hub Kredensial</h2>
          <p className="text-xs text-gray-500 mt-0.5">Kelola data seluruh sertifikasi Anda dalam bentuk tabel tabular interaktif.</p>
        </div>
        {isOwner && (
          <button
            onClick={onAddNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Kredensial</span>
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama, organisasi penerbit, atau keahlian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="Semua">Semua Kategori</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
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
            {filtered.length > 0 ? (
              filtered.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50/40 transition-colors">
                  {/* Title & Category */}
                  <td className="px-6 py-4 max-w-xs lg:max-w-md">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 border border-gray-100 rounded-lg overflow-hidden shrink-0 bg-gray-50 flex items-center justify-center">
                        {cert.imageUrl ? (
                          <img 
                            src={cert.imageUrl} 
                            alt={cert.title} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Award className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-gray-900 leading-tight line-clamp-2 hover:text-blue-600 transition-colors">
                          {cert.title}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
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
                  </td>

                  {/* Publisher / Org */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-semibold text-gray-800">
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
          {filtered.length > 0 ? (
            filtered.map((cert) => (
              <div key={cert.id} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3 shadow-inner">
                {/* Header card info */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 border border-gray-250 rounded-xl overflow-hidden shrink-0 bg-white flex items-center justify-center">
                    {cert.imageUrl ? (
                      <img 
                        src={cert.imageUrl} 
                        alt={cert.title} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
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
  );
}
