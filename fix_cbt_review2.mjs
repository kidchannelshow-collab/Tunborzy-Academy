import fs from 'fs';
let code = fs.readFileSync('src/components/cbt/CBTReviewView.tsx', 'utf8');

// Fix answer map loading
code = code.replace(/const answersMap: Record<string, number> = {};/g, 'const answersMap: Record<string, string> = {};');

const renderOld = `        <div className="space-y-3">
          {q.options.map((opt: string, idx: number) => {
            const isSelected = selectedOption === idx;
            const isActualCorrect = q.correct_option === idx;
            
            let bgClass = "bg-slate-900/50 border-slate-800";
            let textClass = "text-slate-300";
            let icon = null;

            if (isActualCorrect) {
              bgClass = "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10";
              textClass = "text-emerald-400 font-medium";
              icon = <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />;
            } else if (isSelected && !isActualCorrect) {
              bgClass = "bg-rose-500/10 border-rose-500";
              textClass = "text-rose-400";
              icon = <XCircle size={20} className="text-rose-500 shrink-0" />;
            }

            return (
              <div
                key={idx}
                className={\`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center justify-between gap-4 \${bgClass}\`}
              >
                <div className="flex items-center gap-4">
                  <div className={\`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-action font-bold text-sm border-2 \${isActualCorrect ? 'bg-emerald-500 border-emerald-500 text-slate-950' : isSelected ? 'bg-rose-500 border-rose-500 text-slate-950' : 'border-slate-600 text-slate-400'}\`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className={\`font-body text-base md:text-lg \${textClass}\`}>{opt}</span>
                </div>
                {icon}
              </div>
            );
          })}
        </div>`;

const renderNew = `        <div className="space-y-3">
          {['A', 'B', 'C', 'D'].map((letter) => {
            const optKey = 'option_' + letter.toLowerCase();
            const optText = q[optKey];
            if (!optText) return null;
            const isSelected = selectedOption === letter;
            const isActualCorrect = q.correct_option === letter;
            
            let bgClass = "bg-slate-900/50 border-slate-800";
            let textClass = "text-slate-300";
            let icon = null;

            if (isActualCorrect) {
              bgClass = "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10";
              textClass = "text-emerald-400 font-medium";
              icon = <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />;
            } else if (isSelected && !isActualCorrect) {
              bgClass = "bg-rose-500/10 border-rose-500";
              textClass = "text-rose-400";
              icon = <XCircle size={20} className="text-rose-500 shrink-0" />;
            }

            return (
              <div
                key={letter}
                className={\`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center justify-between gap-4 \${bgClass}\`}
              >
                <div className="flex items-center gap-4">
                  <div className={\`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-action font-bold text-sm border-2 \${isActualCorrect ? 'bg-emerald-500 border-emerald-500 text-slate-950' : isSelected ? 'bg-rose-500 border-rose-500 text-slate-950' : 'border-slate-600 text-slate-400'}\`}>
                    {letter}
                  </div>
                  <span className={\`font-body text-base md:text-lg \${textClass}\`}>{optText}</span>
                </div>
                {icon}
              </div>
            );
          })}
        </div>`;

code = code.replace(renderOld, renderNew);
fs.writeFileSync('src/components/cbt/CBTReviewView.tsx', code);
