const fs = require('fs');
let content = fs.readFileSync('src/lib/useProfile.ts', 'utf8');

const target1 = `async function fetchProfileForUser(user: any) {`;
const replacement1 = `async function fetchProfileForUser(user: any, force = false) {`;

const target2 = `  if (fetchProfilePromise) {
    return fetchProfilePromise;
  }`;
const replacement2 = `  if (fetchProfilePromise) {
    if (!force) {
      return fetchProfilePromise;
    } else {
      await fetchProfilePromise; // wait for it to finish
    }
  }`;

const target3 = `export async function refreshProfile() {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await console.log("getUser resolved. user:", user);
    
    await fetchProfileForUser(user);
  } catch (err) {
    console.warn("refreshProfile error:", err);
  }
}`;
const replacement3 = `export async function refreshProfile() {
  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await console.log("getUser resolved. user:", user);
    
    await fetchProfileForUser(user, true);
  } catch (err) {
    console.warn("refreshProfile error:", err);
  }
}`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
content = content.replace(target3, replacement3);
fs.writeFileSync('src/lib/useProfile.ts', content);
console.log('useProfile.ts patched with force parameter.');
