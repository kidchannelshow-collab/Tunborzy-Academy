import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Monitor, Image as ImageIcon, Type, Layout, Link as LinkIcon } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';

export default function WebsiteManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isIrreversible, setIsIrreversible] = useState(false);

  const handleDangerousAction = (title: string, message: string, irreversible: boolean) => {
    setActionTitle(title);
    setActionMessage(message);
    setIsIrreversible(irreversible);
    setIsModalOpen(true);
  };

  const SECTIONS = [
    { title: 'Landing Page Banner', icon: ImageIcon, desc: 'Update hero images .', hasDelete: true },
    { title: 'Website Logo', icon: ImageIcon, desc: 'Update primary and secondary logos.', hasDelete: true },
    { title: 'Website Copy', icon: Type, desc: 'Edit text, headings, and descriptions.', hasDelete: false },
    { title: 'Contact Information', icon: Layout, desc: 'Update WhatsApp number and emails.', hasDelete: false },
    { title: 'Social Media Links', icon: LinkIcon, desc: 'Manage external social media profiles.', hasDelete: true },
    { title: 'Announcements', icon: Type, desc: 'Manage top bar announcements.', hasDelete: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-7xl mx-auto relative"
    >
      <ConfirmationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => setIsModalOpen(false)}
        title={actionTitle}
        message={actionMessage}
        isIrreversible={isIrreversible}
      />

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <Monitor className="text-blue-400" size={28} /> Website Management
        </h1>
        <p className="text-sm font-body text-slate-400">Edit and manage all visible parts of the TUNBORZY platform.</p>
      </div>

      <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-3xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Under Development</h2>
        <p className="text-slate-400 max-w-lg mx-auto">
          Website management features (Landing Page Banner, Logo, Copy, Contact Info) will be implemented in a future update.
        </p>
      </div>
    </motion.div>
  );
}
