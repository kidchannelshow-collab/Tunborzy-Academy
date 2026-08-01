import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Search, Filter, PlayCircle, Headphones, Link2, FileArchive, Image as ImageIcon, BookOpen, Clock, File, Bookmark, Zap
} from 'lucide-react';
import DashboardLayout from './dashboard/DashboardLayout';
import { supabase } from '../supabaseClient';
import { useProfile } from '../lib/useProfile';
import MaterialViewer from './materials/MaterialViewer';

interface ResourceLibraryPageProps {
  onLogout: () => void;
  onNavigate?: (view: string) => void;
}

export default function ResourceLibraryPage({ onLogout, onNavigate }: ResourceLibraryPageProps) {
  const { profile } = useProfile();
  
  const [activeTab, setActiveTab] = useState<'recommended' | 'recent' | 'saved' | 'viewed'>('recommended');
  const [materials, setMaterials] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All Types');
  
  const [viewingMaterial, setViewingMaterial] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!supabase || !profile) {
        setMaterials([]);
        setLoading(false);
        return;
      }
      try {
        // Build query based on student profile to automatically distribute materials
        let query = supabase.from('materials').select('*').eq('is_published', true);
        
        const userRole = profile.role?.toLowerCase();
        const userPortal = profile.portal || profile.academic_portal;
        if (userRole === 'student') {
          if (userPortal) query = query.eq('portal', userPortal);
          if (userPortal === 'Undergraduate') {
            if (profile.department) query = query.eq('department', profile.department);
            if (profile.level) query = query.eq('level', profile.level);
          }
        }
        
        // Order by newest
        query = query.order('created_at', { ascending: false });
        
        const { data: mats, error: matsError } = await query;
        if (matsError) throw matsError;
        
        setMaterials(mats || []);
        
        // Load saved materials IDs
        const { data: saved } = await supabase.from('saved_materials').select('material_id').eq('user_id', profile.id);
        if (saved) {
          setSavedIds(new Set(saved.map(s => s.material_id)));
        }
      } catch (err) {
        console.error(err);
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [profile]);

  const getIconForType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf': return <FileText className="text-red-400" />;
      case 'audio': return <Headphones className="text-purple-400" />;
      case 'ppt': return <FileArchive className="text-orange-400" />;
      case 'doc': return <FileText className="text-blue-500" />;
      case 'zip': return <FileArchive className="text-amber-500" />;
      case 'image': return <ImageIcon className="text-emerald-400" />;
      case 'link': return <Link2 className="text-cyan-400" />;
      default: return <File className="text-slate-400" />;
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
      (m.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.course_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.lecturer_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = filterType === 'All Types' || m.file_type?.toLowerCase() === filterType.toLowerCase();
    
    const matchesTab = 
      activeTab === 'saved' ? savedIds.has(m.id) :
      activeTab === 'recommended' ? true : // Simplify logic for demo
      true;

    return matchesSearch && matchesType && matchesTab;
  });

  return (
    <DashboardLayout onLogout={onLogout} currentView="resources" onNavigate={onNavigate}>
      <AnimatePresence mode="wait">
        {viewingMaterial ? (
          <MaterialViewer 
            material={viewingMaterial} 
            onClose={() => setViewingMaterial(null)} 
          />
        ) : (
          <motion.div
            key="library-home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-7xl mx-auto"
          >
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-white mb-2">My Materials</h1>
                <p className="text-sm font-body text-slate-400">
                  {profile?.academic_portal ? `Showing materials for ${profile.academic_portal} ${profile.department ? ` - ${profile.department}` : ''}` : 'Access all your study materials in one organized place.'}
                </p>
              </div>
              
              <div className="flex bg-[#0f172a]/80 border border-slate-800 rounded-xl p-1 w-full md:w-auto overflow-x-auto custom-scrollbar backdrop-blur-md">
                {[
                  { id: 'recommended', label: 'Recommended', icon: <Zap size={16}/> },
                  { id: 'recent', label: 'Recent', icon: <Clock size={16}/> },
                  { id: 'saved', label: 'Saved', icon: <Bookmark size={16}/> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-action font-semibold whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-[#0f172a]/80 backdrop-blur-md border border-slate-800 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 shadow-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Search by title, subject, course code, or lecturer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#020617]/50 border border-slate-700 text-white text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              
              <div className="relative w-full md:w-48 shrink-0">
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full appearance-none bg-[#020617]/50 border border-slate-700 text-slate-300 text-sm rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
                >
                  <option>All Types</option>
                  <option value="pdf">PDFs</option>
                  <option value="pdf">Documents</option>
                  <option value="audio">Audio</option>
                  <option value="ppt">PowerPoint</option>
                  <option value="doc">Documents</option>
                </select>
                <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Materials Grid */}
            {loading ? (
              <div className="flex justify-center p-12">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredMaterials.map((m) => (
                  <motion.div 
                    key={m.id}
                    layoutId={`card-${m.id}`}
                    whileHover={{ y: -5 }}
                    onClick={() => setViewingMaterial(m)}
                    className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all shadow-xl group cursor-pointer flex flex-col"
                  >
                    {/* Thumbnail area for PDF/Image */}
                    {m.file_type === 'pdf' && m.thumbnail_url ? (
                      <div className="h-40 w-full bg-slate-900 relative overflow-hidden">
                        <img src={m.thumbnail_url} alt={m.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 bg-amber-500/90 text-slate-950 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            <PlayCircle size={24} className="ml-1" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0 shadow-inner group-hover:bg-slate-800 transition-colors">
                          {getIconForType(m.file_type)}
                        </div>
                        {savedIds.has(m.id) && (
                          <Bookmark size={18} className="text-amber-500" fill="currentColor" />
                        )}
                      </div>
                      
                      <div className="mb-4 flex-1">
                        <h3 className="text-lg font-display font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">
                          {m.title}
                        </h3>
                        <p className="text-sm font-body text-slate-400 line-clamp-1">
                          {m.course_code ? `${m.course_code} • ` : ''}{m.subject}
                        </p>
                        {m.lecturer_name && (
                          <p className="text-xs text-slate-500 mt-1">by {m.lecturer_name}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/50 text-xs font-action font-semibold text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="uppercase tracking-wider text-slate-400 bg-slate-800/50 px-2 py-1 rounded">{m.file_type}</span>
                          <span>{m.file_size}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-[#0f172a]/50 border border-slate-800 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                  <BookOpen size={24} className="text-slate-500" />
                </div>
                <h3 className="text-xl font-display font-bold text-white mb-2">No materials found</h3>
                <p className="text-slate-400 max-w-md">
                  We couldn't find any materials matching your criteria. Try adjusting your filters or search terms.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
