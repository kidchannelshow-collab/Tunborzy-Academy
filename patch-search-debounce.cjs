const fs = require('fs');

let content = fs.readFileSync('src/components/GlobalSearch.tsx', 'utf8');

const target = `  useEffect(() => {
    const fetchResults = async () => {`;

const replacement = `  useEffect(() => {
    const timer = setTimeout(async () => {
    const fetchResults = async () => {`;

// Wait, I can just write a better replacement using regex
let match = content.match(/useEffect\(\(\) => \{\n\s*const fetchResults = async \(\) => \{[\s\S]*?fetchResults\(\);\n\s*\}, \[query, activeFilter, userRole\]\);/);

if (match) {
  let newBlock = match[0].replace(/fetchResults\(\);\n\s*\}/, "fetchResults();\n    }, 300);\n    return () => clearTimeout(timer);");
  newBlock = newBlock.replace("useEffect(() => {\n    const fetchResults", "useEffect(() => {\n    const timer = setTimeout(() => {\n    const fetchResults");
  
  content = content.replace(match[0], newBlock);
  fs.writeFileSync('src/components/GlobalSearch.tsx', content);
  console.log('GlobalSearch.tsx patched with debounce.');
}
