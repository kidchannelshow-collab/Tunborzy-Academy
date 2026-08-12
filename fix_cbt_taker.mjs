import fs from 'fs';
let code = fs.readFileSync('src/components/cbt/CBTExamTaker.tsx', 'utf8');

// Fix keyboard shortcuts
const kbdOld = `      // Options A, B, C, D
      const opts = ['a', 'b', 'c', 'd'];
      const q = questions[currentIdx];
      if (q && opts.includes(e.key.toLowerCase())) {
        const idx = opts.indexOf(e.key.toLowerCase());
        if (idx < q.options.length) handleSelectOption(idx);
      }`;
const kbdNew = `      // Options A, B, C, D
      const opts = ['a', 'b', 'c', 'd'];
      const q = questions[currentIdx];
      if (q && opts.includes(e.key.toLowerCase())) {
        const idx = opts.indexOf(e.key.toLowerCase());
        const letter = String.fromCharCode(65 + idx);
        handleSelectOption(letter);
      }`;
code = code.replace(kbdOld, kbdNew);

// Fix answers state type
code = code.replace(/setAnswers<Record<string, number>>/g, 'setAnswers<Record<string, string>>');
code = code.replace(/Record<string, number>/g, 'Record<string, string>');

// Fix handleSelectOption
code = code.replace(
  'const handleSelectOption = (idx: number) => {',
  'const handleSelectOption = (letter: string) => {'
);
code = code.replace(
  'setAnswers({ ...answers, [q.id]: idx });',
  'setAnswers({ ...answers, [q.id]: letter });'
);

// Fix render
const renderOld = `                <div className="space-y-3">
                  {q.options.map((opt: string, idx: number) => {
                    const isSelected = answers[q.id] === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        className={\`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center gap-4 \${isSelected ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800 text-slate-300'}\`}
                      >
                        <div className={\`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-action font-bold text-sm border-2 transition-colors \${isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-600 text-slate-400'}\`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1 text-sm md:text-base leading-relaxed">
                          {opt}
                        </div>
                      </button>
                    );
                  })}
                </div>`;
                
const renderNew = `                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const optKey = 'option_' + letter.toLowerCase();
                    const optText = q[optKey];
                    if (!optText) return null;
                    const isSelected = answers[q.id] === letter;
                    return (
                      <button
                        key={letter}
                        onClick={() => handleSelectOption(letter)}
                        className={\`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center gap-4 \${isSelected ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800 text-slate-300'}\`}
                      >
                        <div className={\`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-action font-bold text-sm border-2 transition-colors \${isSelected ? 'bg-amber-500 border-amber-500 text-slate-950' : 'border-slate-600 text-slate-400'}\`}>
                          {letter}
                        </div>
                        <div className="flex-1 text-sm md:text-base leading-relaxed">
                          {optText}
                        </div>
                      </button>
                    );
                  })}
                </div>`;
code = code.replace(renderOld, renderNew);

fs.writeFileSync('src/components/cbt/CBTExamTaker.tsx', code);
