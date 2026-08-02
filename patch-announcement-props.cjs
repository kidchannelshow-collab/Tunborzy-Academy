const fs = require('fs');

let content = fs.readFileSync('src/components/AnnouncementCenter.tsx', 'utf8');
content = content.replace(
  `export default function AnnouncementCenter({ onBack }: { onBack?: () => void }) {`,
  `export default function AnnouncementCenter({ onBack, onNavigate }: { onBack?: () => void, onNavigate?: (view: string) => void }) {`
);

const targetLink = `{notif.link && (
                    <a href={notif.link} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                       View Details
                    </a>
                  )}`;
                  
const replacementLink = `{notif.link && (
                    <button onClick={async () => {
                        try {
                           await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
                        } catch(e) {}
                        
                        if (onNavigate) {
                           // The link is usually a string like '/cbt'. We'll map it to view names.
                           const view = notif.link.replace('/', '');
                           onNavigate(view);
                        }
                    }} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                       View Details
                    </button>
                  )}`;

content = content.replace(targetLink, replacementLink);

fs.writeFileSync('src/components/AnnouncementCenter.tsx', content);
console.log('AnnouncementCenter props patched.');
