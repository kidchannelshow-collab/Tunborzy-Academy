import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isIrreversible?: boolean;
}

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'This action may permanently affect the platform. Are you sure you want to continue?',
  isIrreversible = false
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-[#0f172a] border border-slate-800 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
              <AlertTriangle className="text-amber-500" size={24} />
            </div>
            <h3 className="text-xl font-display font-bold text-white mb-2 flex items-center gap-2">
              ⚠ {title}
            </h3>
            <p className="text-sm text-slate-400 mb-2">
              {message}
            </p>
            {isIrreversible && (
              <p className="text-sm text-rose-500 font-semibold mb-6">
                This action cannot be undone.
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button 
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-300 font-semibold hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors text-white ${
                  isIrreversible ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600 text-slate-900'
                }`}
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
