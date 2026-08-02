const fs = require('fs');

let content = fs.readFileSync('src/components/AnnouncementCenter.tsx', 'utf8');

const target = `{notif.link && (
                    <a href={notif.link} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                       View Details
                    </a>
                  )}`;
                  
const replacement = `{notif.link && (
                    <button onClick={() => {
                        // Mark as read first
                        supabase.from('notifications').update({ is_read: true }).eq('id', notif.id).then(() => {
                           // Try to navigate using the prop if it's passed, but AnnouncementCenter might not have onNavigate.
                           // The parent should pass it. Let's see if onBack exists. If it's a URL path, we can use window.location.
                        });
                    }} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                       View Details
                    </button>
                  )}`;

// Let's check AnnouncementCenter props
