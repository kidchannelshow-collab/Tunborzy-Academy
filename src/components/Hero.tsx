import { motion } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';
import heroImage from '../assets/images/regenerated_image_1783920306580.png';

export default function Hero({ onSignUp, onLogin }: { onSignUp?: () => void, onLogin?: () => void }) {
  return (
    <section id="home" className="pt-24 md:pt-20 overflow-hidden relative hero-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid-border border-y-0 border-l-0 border-r-0 md:grid md:grid-cols-12 md:gap-0 min-h-[calc(100dvh-80px)]">
        
        <div className="md:col-span-7 flex flex-col justify-center py-12 md:px-16 space-y-6 md:grid-border md:border-y-0 md:border-l-0">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="space-y-4"
          >
            <motion.span 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-promo font-bold tracking-widest uppercase mb-4">
              The Future of Learning
            </motion.span>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="leading-[1.1] mb-6 tracking-tight text-white font-display font-extrabold text-[60px]">
              Elevate your <br className="hidden sm:block" />
              <span className="accent-text">academic journey.</span>
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-lg md:text-xl text-slate-400 mb-8 max-w-md leading-relaxed font-promo font-bold">
              The most comprehensive academic portal for UTME, Post-UTME, and Undergraduate success in Nigeria.
            </motion.p>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <motion.button 
                onClick={onSignUp}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(37, 99, 235, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 px-8 py-4 rounded-xl font-action font-semibold hover:bg-blue-500 transition-all flex items-center justify-center gap-2 group text-white shadow-lg shadow-blue-500/20 relative overflow-hidden"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                <span className="absolute inset-0 bg-white/20 w-0 group-hover:w-full transition-all duration-300 -z-10"></span>
              </motion.button>
              <motion.button 
                onClick={onLogin}
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)", borderColor: "rgba(245, 158, 11, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="border border-slate-700 px-8 py-4 rounded-xl font-action font-semibold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-white"
              >
                <Play className="w-4 h-4 text-amber-500" />
                Login
              </motion.button>
            </motion.div>
          </motion.div>
        </div>
        
        <div className="md:col-span-5 py-12 md:p-12 flex items-center justify-center bg-slate-900/50 mt-8 md:mt-0">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full aspect-square md:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative animate-float"
          >
            <img 
              src={heroImage} 
              alt="Students in classroom" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
        
      </div>
    </section>
  );
}
