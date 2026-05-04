import { motion } from 'framer-motion';

export default function ProjectCard({ title, desc, metrics }) {
  return (
    <motion.div 
      whileHover={{ y: -12, rotate: -1.5 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="border-2 border-ink p-8 bg-paper relative group cursor-pointer shadow-[4px_4px_0px_0px_rgba(28,28,28,1)] hover:shadow-[12px_12px_0px_0px_rgba(28,28,28,1)] transition-shadow duration-300"
    >
      <div className="absolute inset-0 bg-highlighter opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
      
      {/* Changed to font-mono and added uppercase for that technical readout look */}
      <h3 className="font-mono font-bold text-4xl mb-6 relative z-10 uppercase tracking-tight">{title}</h3>
      
      <p className="text-sm leading-relaxed mb-8 opacity-90 relative z-10 font-mono">{desc}</p>
      
      <div className="border-t-2 border-ink pt-4 flex justify-between items-center relative z-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">{metrics}</span>
        <span className="text-xl group-hover:translate-x-2 transition-transform duration-300">→</span>
      </div>
    </motion.div>
  );
}