import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, XCircle, Clock, RotateCcw, ArrowLeft, BookOpen, Eye } from 'lucide-react';

interface UTMEResultViewProps {
  result: {
    score: number;
    totalCorrect: number;
    totalWrong: number;
    totalUnanswered: number;
    totalQuestions: number;
    timeUsed: number;
    results: any[];
  };
  onRetry: () => void;
  onBack: () => void;
}

export default function UTMEResultView({ result, onRetry, onBack }: UTMEResultViewProps) {
  const [showReview, setShowReview] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {!showReview ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-8 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Award size={40} />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                Practice Completed
              </span>
              <h1 className="text-4xl font-display font-bold text-white mt-3">{result.score}%</h1>
              <p className="text-slate-400 mt-1">Your UTME examination performance summary</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-sm text-slate-400">Total Questions</div>
                <div className="text-2xl font-bold text-white mt-1">{result.totalQuestions}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-sm text-emerald-400">Correct</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">{result.totalCorrect}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-sm text-rose-400">Incorrect</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">{result.totalWrong}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                <div className="text-sm text-slate-400">Time Used</div>
                <div className="text-2xl font-bold text-white mt-1">{formatTime(result.timeUsed)}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <button
                onClick={() => setShowReview(true)}
                className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
              >
                <Eye size={18} /> Review Answers
              </button>
              <button
                onClick={onRetry}
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition-colors"
              >
                <RotateCcw size={18} /> Try Another Attempt
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowReview(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <ArrowLeft size={16} /> Back to Results Summary
            </button>
            <h2 className="text-xl font-bold text-white">Answer Review & Explanations</h2>
          </div>

          <div className="space-y-4">
            {result.results.map((r, idx) => (
              <div
                key={r.id}
                className={`bg-[#0f172a] border rounded-3xl p-6 md:p-8 space-y-4 ${
                  r.is_correct ? 'border-emerald-500/30' : 'border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {idx + 1}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    r.is_correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {r.is_correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    {r.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                </div>

                <div className="text-lg font-medium text-white">{r.question_text}</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {[
                    { letter: 'A', text: r.option_a },
                    { letter: 'B', text: r.option_b },
                    { letter: 'C', text: r.option_c },
                    { letter: 'D', text: r.option_d }
                  ].map(opt => {
                    const isStudentChoice = r.student_answer === opt.letter;
                    const isCorrectChoice = r.correct_option === opt.letter;

                    let bg = "bg-slate-900/60 border-slate-800 text-slate-300";
                    if (isCorrectChoice) bg = "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold";
                    else if (isStudentChoice && !isCorrectChoice) bg = "bg-rose-500/20 border-rose-500 text-rose-200 font-bold";

                    return (
                      <div key={opt.letter} className={`p-3.5 rounded-xl border flex items-center gap-3 ${bg}`}>
                        <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                          {opt.letter}
                        </div>
                        <div className="text-sm flex-1">{opt.text}</div>
                      </div>
                    );
                  })}
                </div>

                {r.explanation && (
                  <div className="mt-4 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl text-sm text-slate-300 space-y-1">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Explanation</span>
                    <p>{r.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
