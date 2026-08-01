import { motion } from 'motion/react';
import avatar1 from '../assets/images/regenerated_image_1783921776299.jpg';
import avatar2 from '../assets/images/regenerated_image_1783921776852.jpg';
import avatar3 from '../assets/images/regenerated_image_1783921777310.jpg';

const reviews = [
  {
    name: "Adewale Johnson",
    role: "University of Lagos",
    content: <>Tunborzy was the key to my <span className="font-space font-bold text-[1.1em]">312</span> JAMB score! The mock exams were incredibly accurate.</>,
    avatar: avatar1
  },
  {
    name: "Michael Adebayo",
    role: "Undergraduate Student",
    content: "The undergraduate portal has been a lifesaver. Complex engineering concepts broken down simply.",
    avatar: avatar2
  },
  {
    name: "Chioma Nwosu",
    role: "Post-UTME Candidate",
    content: "I struggled with time management. The personalized learning paths helped me build speed.",
    avatar: avatar3
  }
];

export default function Testimonials() {
  return (
    <section className="bg-slate-900/50 grid-border border-x-0 border-t-0 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid-border border-y-0 border-x-0">
        
        <div className="py-16 text-center max-w-2xl mx-auto grid-border border-x-0 border-t-0 border-b">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-display font-extrabold tracking-tighter text-white mb-4"
          >
            Student Success Stories
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-body font-normal"
          >
            Hear from students who have achieved their goals.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {reviews.map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`p-8 md:p-12 flex flex-col space-y-6 transition-colors ${index < 2 ? 'md:grid-border md:border-y-0 md:border-l-0 border-b md:border-b-0 border-white/10' : ''} group`}
            >
              <p className="text-slate-300 text-sm leading-relaxed italic flex-1 font-body font-normal">"{review.content}"</p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 relative">
                  <motion.img 
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.3 }}
                    src={review.avatar} 
                    alt={review.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <div>
                  <h4 className="text-white font-display font-bold text-sm">— {review.name}</h4>
                  <p className="text-xs font-poppins font-medium text-slate-500 uppercase tracking-tighter mt-1">{review.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
