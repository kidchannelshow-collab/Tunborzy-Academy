const fs = require('fs');

let content = fs.readFileSync('src/components/cbt/CBTExamTaker.tsx', 'utf8');

const target = `export default function CBTExamTaker({ examId, attemptId, onFinish, onCancel, customConfig }: any) {
  const [questions, setQuestions] = useState<any[]>([]);`;

const replacement = `import { useProfile } from '../../lib/useProfile';

export default function CBTExamTaker({ examId, attemptId, onFinish, onCancel, customConfig }: any) {
  const { profile } = useProfile();
  const [questions, setQuestions] = useState<any[]>([]);`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/cbt/CBTExamTaker.tsx', content);
console.log('CBTExamTaker patched with useProfile.');
