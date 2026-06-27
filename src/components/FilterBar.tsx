import React from "react";
import { Search, Plus } from "lucide-react";
import { CATEGORIES, Certificate } from "../types";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  dateFilterType: string;
  setDateFilterType: (val: string) => void;
  selectedMonth: string;
  setSelectedMonth: (val: string) => void;
  customDateStart: string;
  setCustomDateStart: (val: string) => void;
  customDateEnd: string;
  setCustomDateEnd: (val: string) => void;
  certificates: Certificate[];
  isOwner: boolean;
  isAdminVisible: boolean;
  onAdminToggle: () => void;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  dateFilterType,
  setDateFilterType,
  selectedMonth,
  setSelectedMonth,
  customDateStart,
  setCustomDateStart,
  customDateEnd,
  setCustomDateEnd,
  certificates,
  isOwner,
  isAdminVisible,
  onAdminToggle
}: FilterBarProps) {
  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row flex-1 w-full xl:max-w-lg gap-3">
        {isOwner && (
          <button
            onClick={onAdminToggle}
            className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto shrink-0 ${isAdminVisible ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            {isAdminVisible ? (
              "Batal"
            ) : (
              <>
                <Plus className="w-4 h-4" /> Tambah
              </>
            )}
          </button>
        )}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari sertifikat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 justify-end flex-1">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer w-full sm:w-auto"
        >
          <option value="Semua">Semua Kategori ({certificates.length})</option>
          <option value="Unggulan">⭐ Unggulan ({certificates.filter(c => c.isFeatured).length})</option>
          {CATEGORIES.map((cat) => {
            const count = certificates.filter(c => c.category === cat).length;
            return (
              <option key={cat} value={cat}>{cat} ({count})</option>
            );
          })}
        </select>

        <select
          value={dateFilterType}
          onChange={(e) => setDateFilterType(e.target.value)}
          className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer w-full sm:w-auto"
        >
          <option value="Semua Waktu">Semua Waktu</option>
          <option value="7 Hari Terakhir">7 Hari Terakhir</option>
          <option value="30 Hari Terakhir">30 Hari Terakhir</option>
          <option value="90 Hari Terakhir">90 Hari Terakhir</option>
          <option value="365 Hari Terakhir">365 Hari Terakhir</option>
          <option value="Bulan Tertentu">Bulan Tertentu</option>
          <option value="Rentang Kustom">Rentang Kustom</option>
        </select>
        
        {dateFilterType === "Bulan Tertentu" && (
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer w-full sm:w-auto"
          />
        )}
        
        {dateFilterType === "Rentang Kustom" && (
          <div className="flex items-center gap-1 w-full sm:w-auto">
            <input 
              type="date" 
              value={customDateStart}
              onChange={(e) => setCustomDateStart(e.target.value)}
              className="flex-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer sm:max-w-[130px]"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={customDateEnd}
              onChange={(e) => setCustomDateEnd(e.target.value)}
              className="flex-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer sm:max-w-[130px]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
