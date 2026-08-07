import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children, testId = "modal", maxWidth = "max-w-3xl" }) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    // Prevent background scroll when modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      data-testid={`${testId}-backdrop`}
    >
      <div className="min-h-full flex items-start justify-center p-4 sm:p-8">
        <div
          className={`bg-[#141414] border border-zinc-700 w-full ${maxWidth} shadow-2xl relative my-auto`}
          onClick={(e) => e.stopPropagation()}
          data-testid={testId}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-8 py-4 sticky top-0 bg-[#141414] z-10">
            <h3 className="text-lg font-black uppercase tracking-tight text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Close"
              data-testid={`${testId}-close-btn`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="px-8 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
