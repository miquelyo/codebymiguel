'use client';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-card rounded-3xl p-6 shadow-2xl border border-border"
          >
            <div className="w-12 h-12 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {title}
            </h3>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl font-semibold text-foreground bg-surface-hover hover:bg-border transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onCancel(); // auto close
                }}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-danger hover:bg-danger/90 shadow-lg shadow-danger/20 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
