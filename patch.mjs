import fs from 'fs';
let code = fs.readFileSync('src/components/materials/MaterialViewer.tsx', 'utf8');

const returnStatement = "return (";
const newReturn = `
  if (material.file_type === 'lesson') {
    return <StudentLessonViewer material={material} onClose={onClose} />;
  }

  return (`;

code = code.replace(returnStatement, newReturn);
fs.writeFileSync('src/components/materials/MaterialViewer.tsx', code);
