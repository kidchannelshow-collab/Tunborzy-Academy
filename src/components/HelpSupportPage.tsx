import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, Book, MessageSquare, Bug, Lightbulb, 
  Send, Activity, Search, ChevronDown, ChevronUp, Paperclip, AlertCircle, Clock, CheckCircle2,
  Server, Database, Brain, MessageCircle, Bell, CreditCard,
  Upload, ArrowRight
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';

interface HelpSupportPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

const FAQS = [
  { q: "How do I upgrade to Premium?", a: "To upgrade to Premium, navigate to the Premium Features section and complete the payment process securely via Flutterwave." },
  { q: "How do I reset my password?", a: "Go to the Settings page, navigate to the Security section, and you can change your password. If you forgot your password while logged out, use the 'Forgot Password' link on the login screen." },
  { q: "How do I access CBT Practice?", a: "Click on 'CBT Practice' in the sidebar. Select your exam type (JAMB, Post-UTME), subject, and start your timed practice session." },
  
  { q: "How do I contact support?", a: "You can use the 'Contact Support' tab on this page to send us a direct message. Our team usually responds within 24 hours." },
  { q: "How do I change my profile picture?", a: "Go to Settings > Profile, click on your current profile picture, and upload a new image from your device." },
  { q: "How do I change my course?", a: "To change your registered course or university, please contact support with your request, and an admin will update your profile." },
  { q: "How do I use TUNBORZY Academic Assistant?", a: "Click on 'AI Study Assistant' in the sidebar. You can ask questions, request explanations, or have it solve mathematical problems step-by-step." }
];

const TICKETS = [
  { id: "TKT-001", subject: "Cannot access Biology Module 3", date: "Oct 12, 2025", status: "Resolved" },
  { id: "TKT-002", subject: "Payment verification failed", date: "Oct 15, 2025", status: "Closed" },
  { id: "TKT-003", subject: "Feature Request: Dark mode for PDF reader", date: "Oct 20, 2025", status: "In Progress" },
  { id: "TKT-004", subject: "App crashing on chat load", date: "Today", status: "Open" }
];

const SYSTEM_STATUS = [
  { service: "Authentication", status: "Operational", icon: Server },
  { service: "Database", status: "Operational", icon: Database },
  { service: "CBT System", status: "Operational", icon: Activity },
  { service: "AI Assistant", status: "Operational", icon: Brain },
  { service: "Chat System", status: "Maintenance", icon: MessageCircle },
  { service: "Announcements", status: "Operational", icon: Bell },
  { service: "Payment Gateway", status: "Operational", icon: CreditCard }
];

export default function HelpSupportPage({ onLogout, onNavigate }: HelpSupportPageProps) {
  const [activeTab, setActiveTab] = useState('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'In Progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'Resolved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Closed': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      case 'Operational': return 'text-emerald-400';
      case 'Maintenance': return 'text-amber-400';
      case 'Offline': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const filteredFaqs = FAQS.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout onLogout={onLogout} currentView="help_support" onNavigate={onNavigate}>
      <div className="w-full pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8 max-w-5xl mx-auto"
        >
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-slate-800 p-8 sm:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="max-w-xl text-center md:text-left">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-lg shadow-indigo-500/10 border border-indigo-500/30">
                  <HelpCircle size={32} className="text-indigo-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
                  Help & Support
                </h1>
                <p className="text-lg text-slate-300">
                  Need help? We're here to assist you with any questions or issues you might have.
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="w-full md:w-96">
                <div className="relative">
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeTab !== 'faq') setActiveTab('faq');
                    }}
                    placeholder="What do you need help with?"
                    className="w-full bg-[#020617]/50 border border-slate-700 focus:border-indigo-500 text-white rounded-2xl pl-12 pr-4 py-4 outline-none transition-colors backdrop-blur-sm shadow-xl"
                  />
                  {searchQuery && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-2 z-20 max-h-64 overflow-y-auto custom-scrollbar">
                      {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, i) => (
                          <button 
                            key={i} 
                            onClick={() => {
                              setSearchQuery('');
                              setActiveTab('faq');
                              setExpandedFaq(FAQS.indexOf(faq));
                            }}
                            className="w-full text-left p-3 hover:bg-slate-800 rounded-lg transition-colors text-sm text-slate-200"
                          >
                            {faq.q}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-400">No suggestions found.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'guide', icon: Book, label: 'User Guide', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { id: 'faq', icon: MessageSquare, label: 'FAQs', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              { id: 'contact', icon: Send, label: 'Contact Support', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { id: 'bug', icon: Bug, label: 'Report a Bug', color: 'text-rose-400', bg: 'bg-rose-400/10' },
              { id: 'feature', icon: Lightbulb, label: 'Suggest Feature', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { id: 'feedback', icon: MessageCircle, label: 'Send Feedback', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              { id: 'status', icon: Activity, label: 'System Status', color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { id: 'history', icon: Clock, label: 'Ticket History', color: 'text-slate-400', bg: 'bg-slate-400/10' }
            ].map(action => (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className={`p-6 rounded-3xl border transition-all flex flex-col items-center justify-center gap-4 group ${
                  activeTab === action.id 
                    ? 'bg-slate-800/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                    : 'bg-[#0f172a]/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <action.icon size={24} className={action.color} />
                </div>
                <span className={`text-sm font-semibold text-center ${activeTab === action.id ? 'text-white' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 min-h-[500px]">
            <AnimatePresence mode="wait">
              {/* FAQS */}
              {activeTab === 'faq' && (
                <motion.div
                  key="faq"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
                      <MessageSquare className="text-indigo-400" /> Frequently Asked Questions
                    </h2>
                    <p className="text-slate-400">Find quick answers to common questions about the platform.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {filteredFaqs.map((faq, index) => {
                      const isExpanded = expandedFaq === index;
                      return (
                        <div key={index} className="bg-[#020617]/50 border border-slate-800 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => setExpandedFaq(isExpanded ? null : index)}
                            className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-800/50 transition-colors"
                          >
                            <span className="font-semibold text-slate-200">{faq.q}</span>
                            {isExpanded ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} className="text-slate-500" />}
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-5 pt-0 text-slate-400 text-sm leading-relaxed border-t border-slate-800/50">
                                  {faq.a}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    {filteredFaqs.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        No frequently asked questions match your search. Try adjusting your keywords.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* CONTACT SUPPORT */}
              {activeTab === 'contact' && (
                <motion.div
                  key="contact"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
                      <Send className="text-emerald-400" /> Contact Support
                    </h2>
                    <p className="text-slate-400">Send us a message and our support team will get back to you shortly.</p>
                  </div>
                  
                  {showSuccess ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-8 text-center flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} className="text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                      <p className="text-slate-400">We've received your message and created a support ticket. We'll reply to your email soon.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 bg-[#020617]/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Full Name</label>
                          <input required type="text" placeholder="John Doe" className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                          <input required type="email" placeholder="john@example.com" className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                          <select required className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors appearance-none">
                            <option value="">Select a category</option>
                            <option value="account">Account & Billing</option>
                            <option value="courses">Courses & Content</option>
                            <option value="technical">Technical Issue</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Subject</label>
                          <input required type="text" placeholder="What is this regarding?" className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors" />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Message</label>
                        <textarea required placeholder="Describe your issue in detail..." rows={5} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors resize-none custom-scrollbar" />
                      </div>
                      
                      <div className="flex items-center gap-4 pt-2">
                        <button type="button" className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold">
                          <Paperclip size={18} /> Add Attachment
                        </button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                          {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Activity size={18} /></motion.div> : <><Send size={18} /> Submit Ticket</>}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* REPORT BUG */}
              {activeTab === 'bug' && (
                <motion.div
                  key="bug"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
                      <Bug className="text-rose-400" /> Report a Bug
                    </h2>
                    <p className="text-slate-400">Found something broken? Let us know so we can fix it.</p>
                  </div>
                  
                  {showSuccess ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8 text-center flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} className="text-rose-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Bug Reported!</h3>
                      <p className="text-slate-400">Thank you for helping us improve. Our engineers are on it.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 bg-[#020617]/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Bug Title</label>
                          <input required type="text" placeholder="e.g., Chat interface crashes on mobile" className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                          <select required className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors appearance-none">
                            <option value="">Select area</option>
                            <option value="ui">User Interface</option>
                            <option value="chat">Chat Interface</option>
                            <option value="cbt">CBT System</option>
                            <option value="ai">AI Assistant</option>
                            <option value="auth">Login / Signup</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Priority</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {['Low', 'Medium', 'High', 'Critical'].map(p => (
                            <label key={p} className="flex items-center gap-2 p-3 rounded-xl border border-slate-700 bg-[#0f172a] cursor-pointer hover:border-slate-500 transition-colors">
                              <input type="radio" name="priority" value={p.toLowerCase()} className="text-rose-500 focus:ring-rose-500 bg-slate-800 border-slate-600" />
                              <span className="text-sm font-medium text-slate-300">{p}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Describe the Issue</label>
                        <textarea required placeholder="Steps to reproduce the bug..." rows={5} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-rose-500 transition-colors resize-none custom-scrollbar" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button type="button" className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-600 hover:border-slate-400 text-slate-400 hover:text-white bg-[#0f172a] hover:bg-slate-800 transition-all text-sm font-semibold">
                          <Upload size={18} /> Upload Screenshot
                        </button>
                        <button type="button" disabled className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-800 text-slate-600 bg-[#020617] text-sm font-semibold cursor-not-allowed">
                          <MessageCircle size={18} /> Screen Recording (Soon)
                        </button>
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={isSubmitting} className="w-full bg-rose-500 hover:bg-rose-400 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-rose-500/20">
                          {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Activity size={18} /></motion.div> : <><Bug size={18} /> Submit Bug Report</>}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* FEATURE REQUEST */}
              {activeTab === 'feature' && (
                <motion.div
                  key="feature"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-3xl mx-auto space-y-8"
                >
                  <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center justify-center gap-3">
                      <Lightbulb className="text-amber-400" /> Suggest a Feature
                    </h2>
                    <p className="text-slate-400">Have an idea to make TUNBORZY better? We'd love to hear it.</p>
                  </div>
                  
                  {showSuccess ? (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-8 text-center flex flex-col items-center"
                    >
                      <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 size={32} className="text-amber-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Idea Submitted!</h3>
                      <p className="text-slate-400">Thank you for your suggestion. We review every idea to help shape the future of our platform.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 bg-[#020617]/50 border border-slate-800 rounded-3xl p-6 sm:p-8">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Feature Title</label>
                        <input required type="text" placeholder="Short, descriptive title" className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Description</label>
                        <textarea required placeholder="How would this feature work?" rows={4} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar" />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Expected Benefit</label>
                        <textarea required placeholder="Why do you need this? How would it help you study better?" rows={3} className="w-full bg-[#0f172a] border border-slate-700 text-white rounded-xl px-4 py-3 outline-none focus:border-amber-500 transition-colors resize-none custom-scrollbar" />
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-amber-500/20">
                          {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Activity size={18} /></motion.div> : <><Lightbulb size={18} /> Submit Idea</>}
                        </button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* SYSTEM STATUS */}
              {activeTab === 'status' && (
                <motion.div
                  key="status"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
                        <Activity className="text-purple-400" /> System Status
                      </h2>
                      <p className="text-slate-400">Current operational status of all platform services.</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full w-fit">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-sm font-semibold text-emerald-400">All Systems Normal</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {SYSTEM_STATUS.map((item, index) => (
                      <div key={index} className="bg-[#020617]/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4 hover:border-slate-700 transition-colors">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700`}>
                          <item.icon size={24} className="text-slate-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-200">{item.service}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`w-2 h-2 rounded-full ${item.status === 'Operational' ? 'bg-emerald-500' : item.status === 'Maintenance' ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
                            <span className={`text-xs font-semibold ${item.status === 'Operational' ? 'text-emerald-400' : item.status === 'Maintenance' ? 'text-amber-400' : 'text-rose-400'}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Chat Banner */}
                  <div className="mt-8 bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-5 relative z-10">
                      <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/30">
                        <MessageCircle size={28} className="text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">Live Chat Support</h3>
                        <p className="text-slate-400 text-sm">Need immediate assistance? Chat with our team in real-time.</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center sm:items-end gap-2 relative z-10">
                      <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700">
                        <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-slate-400">Offline</span>
                      </div>
                      <span className="text-xs font-semibold text-indigo-400">Live chat will be available soon</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TICKET HISTORY */}
              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 flex items-center gap-3">
                      <Clock className="text-slate-400" /> Support Ticket History
                    </h2>
                    <p className="text-slate-400">Track the status of your previous requests and bug reports.</p>
                  </div>
                  
                  <div className="bg-[#020617]/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="bg-slate-800/50 border-b border-slate-800">
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket ID</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {TICKETS.map((ticket, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4">
                                <span className="text-sm font-mono text-slate-300 font-semibold">{ticket.id}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-200 font-medium">{ticket.subject}</span>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-400">{ticket.date}</span>
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-end gap-1 ml-auto group-hover:translate-x-1 duration-200">
                                  View <ArrowRight size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* OTHER TABS FALLBACK */}
              {['guide', 'feedback'].includes(activeTab) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
                    <AlertCircle size={32} className="text-slate-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 capitalize">{activeTab.replace('_', ' ')}</h3>
                  <p className="text-slate-400 max-w-md">This section is currently being developed and will be available in the next platform update.</p>
                  <button onClick={() => setActiveTab('faq')} className="mt-8 px-6 py-2 rounded-full bg-slate-800 text-white font-semibold hover:bg-slate-700 transition-colors">
                    Back to FAQs
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
