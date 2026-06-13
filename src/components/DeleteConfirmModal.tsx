import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  title,
  description = "Tindakan ini tidak dapat dibatalkan. File sertifikat Anda juga akan dihapus secara permanen dari Google Drive.",
  onConfirm,
  onClose,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-[4px]" 
        onClick={() => {
          if (!isDeleting) onClose();
        }}
      />
      
      {/* Card */}
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 z-10 relative overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="absolute top-4 right-4">
          {!isDeleting && (
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-900 p-1.5 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-2xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-lg font-bold text-gray-950">
                {title}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-50 pt-4">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                await onConfirm();
              }}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
