import { motion } from 'motion/react';
import { Brain, Target, Users, Zap } from 'lucide-react';
import featureImage from '../assets/images/regenerated_image_1787091447544.jpg';

const features = [
  {
    icon: Brain,
    title: 'Expert Tutors',
    description: 'Learn from industry professionals and highly rated academic scholars.'
  },
  {
    icon: Target,
    title: 'Live Classes',
    description: 'Interactive live sessions to master complex subjects efficiently.'
  },
  {
    icon: Users,
    title: 'Active Community',
    description: 'Join thousands of ambitious students and grow together.'
  },
  {
    icon: Zap,
    title: 'Mock Exams',
    description: 'Real-time mock exams to test your knowledge.'
  }
];

export default function Features() {
  return (
    <section id="about" className="bg-[#020617] overflow-hidden grid-border border-x-0 border-t border-b-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid-border border-y-0 border-x-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          <div className="lg:col-span-6 px-4 md:px-16 py-16 md:py-24 flex flex-col justify-center space-y-6 lg:grid-border lg:border-y-0 lg:border-l-0 border-b lg:border-b-0 border-white/10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-poppins font-medium tracking-widest uppercase mb-4">
                Core Features
              </span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-display font-extrabold tracking-tighter text-white leading-tight"
            >
              The definitive platform for <br className="hidden md:block"/> <span className="accent-text">academic excellence.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-400 mb-10 leading-relaxed max-w-md font-body font-normal"
            >
              We go beyond traditional learning. Our platform is built to provide an immersive, supportive educational experience.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="w-full aspect-video rounded-2xl overflow-hidden mt-8 relative shadow-2xl animate-float"
            >
               <motion.img 
                 whileHover={{ scale: 1.05 }}
                 transition={{ duration: 0.4 }}
                 src={featureImage} 
                 alt="Platform Feature" 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer"
               />
            </motion.div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)", zIndex: 10 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
                className={`p-8 md:p-12 transition-all duration-300 flex flex-col justify-center space-y-4 group ${index % 2 === 0 ? 'sm:grid-border sm:border-y-0 sm:border-l-0' : ''} ${index < 2 ? 'grid-border border-x-0 border-t-0' : ''}`}
              >
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2"
                >
                  <feature.icon className="w-6 h-6 text-blue-500 group-hover:text-amber-500 transition-colors" />
                </motion.div>
                <h3 className="text-xl font-display font-bold accent-text">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed font-body font-normal">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
