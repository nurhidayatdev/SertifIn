import React from "react";
import { Certificate } from "../types";
import { ExternalLink, Calendar, Tag } from "lucide-react";

interface CertificateCardProps {
  key?: string;
  cert: Certificate;
  onClick: () => void;
}

export function CertificateCard({ cert, onClick }: CertificateCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Profesional": "bg-slate-55 text-slate-755 border border-slate-105",
      "Kursus & Pelatihan": "bg-green-50 text-green-700 border border-green-100",
      "Magang": "bg-amber-50 text-amber-700 border border-amber-100",
      "Bahasa": "bg-teal-50 text-teal-700 border border-teal-100",
      "Kompetisi": "bg-blue-50 text-blue-700 border border-blue-100",
      "Organisasi": "bg-indigo-50 text-indigo-700 border border-indigo-100",
      "Seminar & Workshop": "bg-purple-50 text-purple-700 border border-purple-100",
      "Akademik": "bg-rose-50 text-rose-700 border border-rose-100"
    };
    return colors[category] || "bg-gray-50 text-gray-700 border border-gray-100";
  };

  const getDisplayImageUrl = (cert: Certificate) => {
    if (cert.fileType === 'pdf' && cert.imageUrl?.includes('/file/d/')) {
      const match = cert.imageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)\//);
      if (match && match[1]) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
      }
    }
    return cert.imageUrl;
  };

  const displayImageUrl = getDisplayImageUrl(cert);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-48 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
        <style dangerouslySetInnerHTML={{__html: `
          .fallback-container .fallback-icon-layer { display: none; }
          .fallback-container.show-fallback .img-layer { display: none; }
          .fallback-container.show-fallback .fallback-icon-layer { display: flex; }
        `}} />
        
        {cert.isFeatured && (
          <div className="absolute top-3 right-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider py-1 px-2 rounded z-10 block">
            Unggulan
          </div>
        )}
        
        {displayImageUrl ? (
          <div className="w-full h-full fallback-container relative">
            <img
              src={displayImageUrl}
              alt={cert.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out img-layer absolute inset-0"
              onError={(e) => {
                e.currentTarget.parentElement?.classList.add('show-fallback');
              }}
            />
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:scale-105 transition-transform duration-500 fallback-icon-layer absolute inset-0 bg-gray-50">
               <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
               </svg>
               <span className="text-xs font-medium uppercase tracking-widest text-gray-500">{cert.fileType === 'pdf' ? 'Dokumen PDF' : 'Gambar'}</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-center mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(cert.category)}`}>
            {cert.category}
          </span>
          <span className="flex items-center text-xs text-gray-550 font-medium">
            <Calendar className="w-3 h-3 mr-1" />
            {cert.date}
          </span>
        </div>
        
        {cert.issuingOrganization && (
          <div className="text-[11px] font-extrabold text-blue-600 mb-1.5 uppercase tracking-wide line-clamp-1">
            {cert.issuingOrganization}
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-4 line-clamp-2 group-hover:text-black transition-colors">
          {cert.title}
        </h3>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-sm font-medium text-gray-600 group-hover:text-black transition-colors">
          Lihat Detail
          <ExternalLink className="w-4 h-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </div>
      </div>
    </div>
  );
}
