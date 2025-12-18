import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const Modal = ({ isOpen, onClose, children }) => {
  const dialogRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // Prevent body scroll
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      // Ensure dialog is closed on unmount
      if (dialog && dialog.open) dialog.close();
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      onClose={onClose}
      popover="auto"
      // onClick={(e) => {
      //   // Close on backdrop click
      //   const rect = e.currentTarget.getBoundingClientRect();
      //   const isInDialog =
      //     rect.top <= e.clientY &&
      //     e.clientY <= rect.top + rect.height &&
      //     rect.left <= e.clientX &&
      //     e.clientX <= rect.left + rect.width;

      //   if (!isInDialog) {
      //     onClose();
      //   }
      // }}
      className="m-auto w-full max-w-4xl rounded-xl bg-white p-0 shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-in open:fade-in-0 open:zoom-in-95"
    >
      <div className="sticky top-0 z-10 flex justify-end border-b border-slate-200 bg-white p-4">
              <button
                onClick={onClose}
                className="rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close details"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
      <div className="p-4">
        {children}
      </div>
    </dialog>,
    document.body
  );
};
