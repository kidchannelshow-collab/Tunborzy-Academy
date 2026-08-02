const fs = require('fs');
let content = fs.readFileSync('src/components/AnnouncementCenter.tsx', 'utf8');

const target = `{notifications.filter(n => {
           if (activeTab === 'unread') return !n.is_read;
           return true;
        }).map(notif => {`;

const replacement = `{notifications.filter(n => {
           if (activeTab === 'unread') return !n.is_read;
           if (activeTab === 'pinned') return false;
           if (activeTab === 'bookmarked') return false;
           return true;
        }).map(notif => {`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/AnnouncementCenter.tsx', content);
console.log('Tabs filtering patched.');
