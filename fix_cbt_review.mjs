import fs from 'fs';
let code = fs.readFileSync('src/components/cbt/CBTReviewView.tsx', 'utf8');

const renderOld = `                <div className="space-y-3">
                  {q.options.map((opt: string, idx: number) => {
                    const isSelected = attempt.answers[q.id] === idx;
                    const isCorrect = idx === q.correct_option;
                    
                    let btnClass = 'border-slate-800 bg-slate-900/50 text-slate-300';
                    let circleClass = 'border-slate-600 text-slate-400';
                    
                    if (isCorrect) {
                      btnClass = 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10';
                      circleClass = 'bg-emerald-500 border-emerald-500 text-slate-950';
                    } else if (isSelected && !isCorrect) {
                      btnClass = 'border-rose-500 bg-rose-500/10';
                      circleClass = 'bg-rose-500 border-rose-500 text-white';
                    }
                    
                    return (
                      <div
                        key={idx}
                        className={\`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center gap-4 \${btnClass}\`}
                      >
                        <div className={\`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-action font-bold text-sm border-2 transition-colors \${circleClass}\`}>
                          {isSelected && !isCorrect ? <X size={16} /> : isCorrect ? <Check size={16} /> : String.fromCharCode(65 + idx)}
                        </div>
                        <div className="flex-1 text-sm md:text-base leading-relaxed">
                          {opt}
                        </div>
                      </div>
                    );
                  })}
                </div>`;

const renderNew = `                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((letter) => {
                    const optKey = 'option_' + letter.toLowerCase();
                    const optText = q[optKey];
                    if (!optText) return null;
                    const isSelected = attempt.answers[q.id] === letter;
                    const isCorrect = letter === q.correct_option;
                    
                    let btnClass = 'border-slate-800 bg-slate-900/50 text-slate-300';
                    let circleClass = 'border-slate-600 text-slate-400';
                    
                    if (isCorrect) {
                      btnClass = 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10';
                      circleClass = 'bg-emerald-500 border-emerald-500 text-slate-950';
                    } else if (isSelected && !isCorrect) {
                      btnClass = 'border-rose-500 bg-rose-500/10';
                      circleClass = 'bg-rose-500 border-rose-500 text-white';
                    }
                    
                    return (
                      <div
                        key={letter}
                        className={\`w-full text-left p-4 md:p-5 rounded-xl border-2 transition-all flex items-center gap-4 \${btnClass}\`}
                      >
                        <div className={\`w-8 h-8 md:w-10 md:h-10 shrink-0 rounded-full flex items-center justify-center font-action font-bold text-sm border-2 transition-colors \${circleClass}\`}>
                          {isSelected && !isCorrect ? <X size={16} /> : isCorrect ? <Check size={16} /> : letter}
                        </div>
                        <div className="flex-1 text-sm md:text-base leading-relaxed">
                          {optText}
                        </div>
                      </div>
                    );
                  })}
                </div>`;

code = code.replace(renderOld, renderNew);
fs.writeFileSync('src/components/cbt/CBTReviewView.tsx', code);
