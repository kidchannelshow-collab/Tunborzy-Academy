const fs = require('fs');

let content = fs.readFileSync('src/components/AnnouncementCenter.tsx', 'utf8');

const targetUserView = `<div className="flex-1 w-full space-y-4">
        {announcements.map(ann => {
          const style = getCategoryStyle(ann.category || 'General Notice');
          const Icon = style.icon;
          return (
            <motion.div 
              key={ann.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={\`bg-[#0f172a]/80 backdrop-blur-md border \${false ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'border-slate-800'} rounded-2xl p-5 relative overflow-hidden group\`}
            >
              {false && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={\`p-2.5 rounded-xl \${style.bg} \${style.color}\`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className={\`text-lg font-bold leading-tight \${false ? 'text-white' : 'text-slate-300'}\`}>
                      {ann.title}
                    </h3>
                    <p className="text-xs font-poppins font-medium text-slate-500 mt-1">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pl-14">
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {ann.content}
                </p>
                <div className="flex items-center gap-4">
                  <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <Check size={14} /> Mark as Read
                  </button>
                  <button className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
                    <Bookmark size={14} /> Save
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>`;
      
const replacementUserView = `<div className="flex-1 w-full space-y-4">
        {notifications.filter(n => {
           if (activeTab === 'unread') return !n.is_read;
           return true;
        }).map(notif => {
          const style = getCategoryStyle(notif.type || 'General Notice');
          const Icon = style.icon;
          return (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={\`bg-[#0f172a]/80 backdrop-blur-md border \${!notif.is_read ? 'border-indigo-500/30 shadow-lg shadow-indigo-500/5' : 'border-slate-800'} rounded-2xl p-5 relative overflow-hidden group\`}
            >
              {!notif.is_read && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>}
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={\`p-2.5 rounded-xl \${style.bg} \${style.color}\`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className={\`text-lg font-bold leading-tight \${!notif.is_read ? 'text-white' : 'text-slate-300'}\`}>
                      {notif.title}
                    </h3>
                    <p className="text-xs font-poppins font-medium text-slate-500 mt-1">
                      {new Date(notif.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pl-14">
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {notif.message}
                </p>
                <div className="flex items-center gap-4">
                  {!notif.is_read && (
                    <button onClick={async () => {
                      try {
                         await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
                      } catch (err) {}
                    }} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                      <Check size={14} /> Mark as Read
                    </button>
                  )}
                  {notif.link && (
                    <a href={notif.link} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                       View Details
                    </a>
                  )}
                  <button onClick={async () => {
                     try {
                        await supabase.from('notifications').delete().eq('id', notif.id);
                     } catch(err) {}
                  }} className="text-xs font-bold text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-1">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {notifications.length === 0 && (
           <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium text-lg">No notifications yet</p>
              <p className="text-slate-500 text-sm mt-1">You're all caught up!</p>
           </div>
        )}
      </div>`;

content = content.replace(targetUserView, replacementUserView);

// We should also replace the unread badge in the tabs
const targetTabs = `{tab.id === 'unread' && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>}`;
const replacementTabs = `{tab.id === 'unread' && notifications.filter(n => !n.is_read).length > 0 && <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{notifications.filter(n => !n.is_read).length}</span>}`;

content = content.replace(targetTabs, replacementTabs);

// Also replace "Mark all as read" and "Clear all read" logic
const markAllTarget = `<button className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <Check size={16} /> Mark all as read
          </button>`;
const markAllReplace = `<button onClick={async () => {
             await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
          }} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-white flex items-center gap-2 transition-colors">
            <Check size={16} /> Mark all as read
          </button>`;

content = content.replace(markAllTarget, markAllReplace);

const clearReadTarget = `<button className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-rose-400 flex items-center gap-2 transition-colors">
            <Trash2 size={16} /> Clear all read
          </button>`;
const clearReadReplace = `<button onClick={async () => {
             await supabase.from('notifications').delete().eq('user_id', profile.id).eq('is_read', true);
          }} className="w-full text-left px-4 py-2 text-sm text-slate-400 hover:text-rose-400 flex items-center gap-2 transition-colors">
            <Trash2 size={16} /> Clear all read
          </button>`;
          
content = content.replace(clearReadTarget, clearReadReplace);

fs.writeFileSync('src/components/AnnouncementCenter.tsx', content);
console.log('UserView in AnnouncementCenter patched.');
