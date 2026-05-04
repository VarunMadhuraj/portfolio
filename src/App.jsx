import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';

// --- THE BRUTALIST CUSTOM CURSOR ---
function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isOverDark, setIsOverDark] = useState(false);
  
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target;
      
      // Check for clickable elements
      const isClickable = target.closest('a, button, .cursor-pointer, [role="button"]');
      setIsHovering(!!isClickable);

      // Aggressive check for dark sections (bg-ink or the footer tag itself)
      const darkSection = target.closest('.bg-ink, footer, [data-dark="true"]');
      setIsOverDark(!!darkSection);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-5 h-5 border-[2px] pointer-events-none z-[9999]"
      style={{ 
        x: smoothX, 
        y: smoothY, 
        translateX: '-50%', 
        translateY: '-50%' 
      }}
      animate={{
        scale: isHovering ? 0.6 : 1,
        rotate: isHovering ? 45 : 0,
        backgroundColor: isHovering ? '#FF331F' : 'transparent', 
        borderColor: isHovering ? '#FF331F' : (isOverDark ? '#F4F4F0' : '#1C1C1C')       
      }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    />
  );
}

// --- REACTIVE ASCII BLUEPRINT GRID ---
const ReactiveBlueprint = () => {
  const canvasRef = useRef(null);
  const mousePos = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const spacing = 45; 
    const maxDist = 150; 

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let x = spacing / 2; x < canvas.width; x += spacing) {
        for (let y = spacing / 2; y < canvas.height; y += spacing) {
          const dx = x - mousePos.current.x;
          const dy = y - mousePos.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let angle = 0;
          let r = 28, g = 28, b = 28;
          let alpha = 0.04; 

          if (dist < maxDist) {
            const factor = Math.pow(1 - dist / maxDist, 2); 
            angle = factor * (Math.PI / 4); 
            alpha = 0.04 + factor * 0.5; 
            r = 28 + (255 - 28) * factor;
            g = 28 + (51 - 28) * factor;
            b = 28 + (31 - 28) * factor;
          }

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillText('+', 0, 0);
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// --- WEBAUDIO SYNTHESIZER LOGIC ---
let audioCtx = null;
const playTone = (freq, customDuration = 1.5, customVol = 0.4) => {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = 'sine'; 
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(customVol, audioCtx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + customDuration);
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + customDuration);
};

const keysConfig = [
  { w: { note: 'C', freq: 261.63, key: 'A' }, b: { note: 'C#', freq: 277.18, key: 'W' } },
  { w: { note: 'D', freq: 293.66, key: 'S' }, b: { note: 'D#', freq: 311.13, key: 'E' } },
  { w: { note: 'E', freq: 329.63, key: 'D' }, b: null },
  { w: { note: 'F', freq: 349.23, key: 'F' }, b: { note: 'F#', freq: 369.99, key: 'T' } },
  { w: { note: 'G', freq: 392.00, key: 'G' }, b: { note: 'G#', freq: 415.30, key: 'Y' } },
  { w: { note: 'A', freq: 440.00, key: 'H' }, b: { note: 'A#', freq: 466.16, key: 'U' } },
  { w: { note: 'B', freq: 493.88, key: 'J' }, b: null },
  { w: { note: 'C5', freq: 523.25, key: 'K' }, b: null },
];

const keyMap = keysConfig.reduce((acc, curr) => {
  acc[curr.w.key] = curr.w;
  if (curr.b) acc[curr.b.key] = curr.b;
  return acc;
}, {});

function BrutalistPiano() {
  const [activeKeys, setActiveKeys] = useState({});
  const sequenceRef = useRef('');
  const isPlayingEasterEgg = useRef(false);
  const [birthdayState, setBirthdayState] = useState({ show: false, isBirthday: false });

  const triggerCmaj7 = useCallback(() => {
    if (isPlayingEasterEgg.current) return;
    isPlayingEasterEgg.current = true;

    const jingleNotes = [
      { f: 1046.50, delay: 0,    dur: 1.5 },
      { f: 987.77,  delay: 300,  dur: 1.5 },
      { f: 783.99,  delay: 600,  dur: 1.5 },
      { f: 659.25,  delay: 900,  dur: 1.5 },
      { f: 493.88,  delay: 1200, dur: 3.0 },
      { f: 587.33,  delay: 1400, dur: 3.0 },
      { f: 659.25,  delay: 1600, dur: 4.0 },
    ];

    jingleNotes.forEach(note => {
      setTimeout(() => { playTone(note.f, note.dur, 0.3); }, note.delay);
    });

    setTimeout(() => {
      isPlayingEasterEgg.current = false;
      setActiveKeys({}); 
    }, 3000);
  }, []);

  const triggerBirthday = useCallback(() => {
    const today = new Date();
    const isActualBirthday = today.getMonth() === 9 && today.getDate() === 6;
    
    setBirthdayState({ show: true, isBirthday: isActualBirthday });

    setTimeout(() => {
      setBirthdayState({ show: false, isBirthday: false });
    }, 5000);
  }, []);

  const handlePlay = useCallback((key, freq) => {
    setActiveKeys(prev => ({ ...prev, [key]: true }));
    playTone(freq);

    sequenceRef.current = (sequenceRef.current + key).slice(-10);
    
    if (sequenceRef.current.endsWith("ADGJS")) {
      triggerCmaj7();
      sequenceRef.current = ''; 
    } else if (sequenceRef.current.endsWith("AASAFD")) {
      triggerBirthday();
      sequenceRef.current = '';
    }
  }, [triggerCmaj7, triggerBirthday]);

  useEffect(() => {
    if (activeKeys['A'] && activeKeys['S'] && activeKeys['D'] && activeKeys['G'] && activeKeys['J']) {
      triggerCmaj7();
    }
  }, [activeKeys, triggerCmaj7]);

  const handleRelease = useCallback((key) => {
    setActiveKeys(prev => ({ ...prev, [key]: false }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const key = e.key.toUpperCase();
      if (keyMap[key]) handlePlay(key, keyMap[key].freq);
    };

    const handleKeyUp = (e) => {
      const key = e.key.toUpperCase();
      if (keyMap[key]) handleRelease(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePlay, handleRelease]);

  return (
    <>
      <AnimatePresence>
        {birthdayState.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-6 backdrop-blur-sm bg-paper/30"
          >
            <div className="bg-ink text-paper p-10 md:p-16 border-2 border-highlighter shadow-[16px_16px_0px_0px_rgba(255,51,31,1)] text-center flex flex-col items-center max-w-xl">
              {birthdayState.isBirthday ? (
                <>
                  <span className="text-7xl md:text-8xl mb-6 block drop-shadow-lg">🎂</span>
                  <h2 className="font-serif text-5xl md:text-6xl uppercase tracking-tighter mb-4">Thank You.</h2>
                  <p className="font-mono text-xs md:text-sm tracking-[0.2em] opacity-50 uppercase border-t border-paper/20 pt-4 mt-2">
                    // SYSTEM_AGE_UPDATED
                  </p>
                </>
              ) : (
                <>
                  <span className="text-7xl md:text-8xl mb-6 block drop-shadow-lg opacity-80">⚠️</span>
                  <h2 className="font-serif text-4xl md:text-5xl uppercase tracking-tighter mb-4 text-highlighter">Access Denied.</h2>
                  <p className="font-mono text-[10px] md:text-xs tracking-[0.2em] opacity-60 uppercase border-t border-paper/20 pt-4 mt-2 leading-relaxed">
                    // Right tune. Wrong day.<br/>// Retry sequence on OCT_06.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 left-0 w-full h-2 md:h-3 flex z-50 group hover:h-16 md:hover:h-20 transition-all duration-500 overflow-hidden border-b-2 border-ink bg-paper cursor-pointer">
        <div className="absolute top-full left-6 mt-2 font-mono text-[8px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none delay-200">
          // SYNTH_READY [A-K] // AWAITING_INPUT...
        </div>

        {keysConfig.map((k) => {
          const isWhiteActive = activeKeys[k.w.key];
          return (
            <div 
              key={k.w.note}
              onMouseDown={() => handlePlay(k.w.key, k.w.freq)}
              onMouseUp={() => handleRelease(k.w.key)}
              onMouseLeave={() => handleRelease(k.w.key)}
              className={`flex-1 relative transition-colors duration-75 cursor-pointer border-r-2 border-ink last:border-r-0
                ${isWhiteActive ? 'bg-ink text-paper' : 'hover:bg-ink/5'}`}
            >
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs font-mono font-bold opacity-0 group-hover:opacity-40 pointer-events-none select-none transition-opacity">
                {k.w.key}
              </span>

              {k.b && (
                <div
                  data-dark="true"
                  onMouseDown={(e) => { e.stopPropagation(); handlePlay(k.b.key, k.b.freq); }}
                  onMouseUp={(e) => { e.stopPropagation(); handleRelease(k.b.key); }}
                  onMouseLeave={(e) => { e.stopPropagation(); handleRelease(k.b.key); }}
                  className={`absolute top-0 right-0 translate-x-1/2 w-6 md:w-10 h-2/3 z-10 transition-colors duration-75 cursor-pointer border-2 border-t-0 border-ink
                    ${activeKeys[k.b.key] ? 'bg-highlighter text-paper' : 'bg-ink hover:bg-ink/80'}`}
                >
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] md:text-[10px] text-paper font-mono opacity-0 group-hover:opacity-70 pointer-events-none select-none transition-opacity">
                    {k.b.key}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// --- PROJECT CARD COMPONENT (DYNAMIC & CLICKABLE) ---
function ProjectCard({ index, title, subtitle, desc, onClick }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.77, 0, 0.175, 1] }}
      onClick={onClick}
      className="group relative z-10 bg-paper border-2 border-ink p-8 flex flex-col justify-between min-h-[260px] hover:shadow-[8px_8px_0px_0px_rgba(255,51,31,1)] hover:border-highlighter hover:-translate-y-2 hover:translate-x-1 transition-all duration-300 cursor-pointer"
    >
      <div>
        <span className="font-mono text-xs opacity-30 group-hover:text-highlighter transition-colors">/0{index + 1}</span>
        <h3 className="font-serif text-3xl uppercase mt-4 mb-2 group-hover:text-highlighter transition-colors">{title}</h3>
        {subtitle && <h4 className="font-mono text-xs md:text-sm opacity-90 font-bold mb-3 text-ink/80">{subtitle}</h4>}
        
        <p className="font-mono text-xs md:text-sm opacity-80 leading-relaxed">{desc}</p>
      </div>

      <div className="mt-8 flex items-center justify-between border-t-2 border-ink/10 pt-4 overflow-hidden">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-30 group-hover:opacity-100 group-hover:text-highlighter transition-colors">
          System_Node
        </span>
        <motion.span 
          className="font-mono text-xs font-bold text-highlighter bg-ink px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          [+ INSPECT ]
        </motion.span>
      </div>
    </motion.div>
  );
}

// --- TIMELINE COMPONENT (DYNAMIC & CLICKABLE) ---
function TimelineItem({ date, title, subtitle, index, onClick }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.77, 0, 0.175, 1] }}
      onClick={onClick}
      className="relative pl-12 pb-24 md:pb-32 last:pb-10 border-l-2 border-ink/20 group cursor-pointer"
    >
      <div className="absolute left-[-9px] top-0 w-4 h-4 bg-paper border-2 border-ink rounded-full z-20 transition-all duration-300 group-hover:bg-highlighter group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(255,51,31,0.5)]" />
      
      <div className="relative z-10 transition-transform duration-300 group-hover:translate-x-2">
        <span className="font-mono text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] block mb-3 transition-colors group-hover:text-highlighter opacity-60 group-hover:opacity-100">
          {date}
        </span>
        <h3 className="font-serif text-3xl md:text-5xl uppercase tracking-tighter mb-2 group-hover:text-highlighter transition-colors">{title}</h3>
        <h4 className="font-mono text-xs md:text-sm opacity-90 font-bold mb-6 text-ink/80">{subtitle}</h4>

        <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest border border-ink/30 px-3 py-1 bg-ink/5 group-hover:bg-highlighter group-hover:border-highlighter group-hover:text-paper transition-all">
          <span className="w-2 h-2 bg-ink group-hover:bg-paper animate-pulse" />
          [+ EXPAND LOG ]
        </span>
      </div>
    </motion.div>
  );
}

// --- MAIN APP ---
function App() {
  const premiumEase = [0.77, 0, 0.175, 1];
  const [familyRevealed, setFamilyRevealed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null); 
  const timeoutRef = useRef(null);
  const lenis = useLenis();

  const triggerFamilyEasterEgg = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setFamilyRevealed(true);
    timeoutRef.current = setTimeout(() => { setFamilyRevealed(false); }, 8000);
  };

  const handleNav = (id) => {
    setMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const menuItems = [
    { title: 'Experience', id: 'experience', desc: 'Internships and professional roles.' },
    { title: 'Education', id: 'education', desc: 'Academic background and studies.' },
    { title: 'Projects', id: 'projects', desc: 'Tools, scripts, and security builds.' },
    { title: 'Certifications', id: 'certs', desc: 'Industry recognized credentials.' },
    { title: 'Skills', id: 'skills', desc: 'Technical stack and proficiencies.' },
  ];

  // --- DATA BLOCKS ---
  const expData = [
    {
      title: "X-Biz Techventures",
      subtitle: "Cybersecurity Analyst Intern | Pune, Maharashtra | Jan – May 2026",
      desc: "Conducted OSINT-driven threat analysis and web application VAPT.",
      date: "JAN 2026 — MAY 2026",
      details: [
        "Conducted OSINT-driven threat analysis across 15+ domains, uncovering 40,000+ exposed sensitive files, 100+ IOCs, and critical misconfigurations; mapped to OWASP Top10 and CWE Frameworks.",
        "Performed web application VAPT using Burp Suite and OSINT concepts, identifying 15+ vulnerabilities (SQLi, XSS, broken authentication) with risk-scored remediation reports.",
        "Attempted an SSL Pinning Bypass attack on a mobile application to find critical vulnerabilities."
      ]
    },
    {
      title: "Tinnovat Science & Tech",
      subtitle: "Technical Trainee | Sharjah, United Arab Emirates | May – July 2024",
      desc: "Developed a full-stack web application with secure API design.",
      date: "MAY 2024 — JULY 2024",
      details: [
        "Developed a full-stack web application using 10+ React.js components.",
        "Implemented Django REST architecture with secure JWT authentication.",
        "Designed resilient API endpoints for seamless front-end integration."
      ]
    }
  ];

  const eduData = [
    {
      title: "VIT-AP University",
      subtitle: "B.Tech Computer Science and Engineering | CGPA: 8.38",
      desc: "Specializing in cybersecurity principles and system architecture.",
      date: "2022 — 2026 | AMARAVATI, INDIA",
      details: [
        "Core focus on Network Defense, Cryptography, and Deep Learning applications.",
        "Active involvement in ACM Student Chapter and technical research.",
        "Maintained consistent academic excellence with an 8.38 CGPA."
      ]
    },
    {
      title: "Chavara Public School",
      subtitle: "Grade XII | 87.6%",
      desc: "Higher secondary education focused on mathematics and sciences.",
      date: "2022 | KOTTAYAM, INDIA",
      details: ["Completed higher secondary education with a strong foundation in physics and mathematics."]
    },
    {
      title: "Our Own English High School",
      subtitle: "Grade X | 91%",
      desc: "Secondary education foundation.",
      date: "2020 | SHARJAH, UAE",
      details: ["Graduated secondary education with distinction."]
    }
  ];

  const projectData = [
    {
      title: "GoPhish",
      subtitle: "Personal Project | April 2026",
      desc: "An ML integrated Phishing Detection System.",
      details: [
        "Built a phishing detector using Python and Gemini 2.5 Flash Lite API to check email URLs and messages for phishing attacks.",
        "Created a Levenshtein Distance based typosquatting detector and used Regular Expressions to detect hexadecimal/raw IP addresses.",
        "Implemented a custom whitelist logic to eliminate false positives and increase detection accuracy."
      ]
    },
    {
      title: "GeoStruct-X",
      subtitle: "Capstone | Aug-Dec 2025",
      desc: "Agentic AI based system to check compliance of building plans.",
      details: [
        "Developed an agentic AI system to automatically evaluate building designs against regulatory and safety compliance rules.",
        "Designed rule-based and AI-driven validation workflows to identify non-compliance risks and generate structured outputs.",
        "Focused heavily on reliability, explainability, and correctness in compliance decision-making frameworks."
      ]
    },
    {
      title: "DARPAn",
      subtitle: "Deep Learning | Jan-May 2025",
      desc: "Deep learning system to convert 2D medical scans into 3D reconstructions.",
      details: [
        "Built a deep learning system to reconstruct 3D anatomical models from 2D medical scans.",
        "Evaluated model performance with an emphasis on data integrity, structural accuracy, and system reliability.",
        "Gained direct experience working with sensitive data contexts and understanding robustness in medical AI systems."
      ]
    },
    {
      title: "CtrlWatt",
      subtitle: "Embedded | Jan-May 2025",
      desc: "ESP32-based smart switch for industrial applications.",
      details: [
        "Designed and implemented a smart switch system using ESP32, enabling remote and automated control of electrical devices.",
        "Built a custom Android application to interface directly with the hardware over secure protocols.",
        "Integrated hardware and firmware components with a focus on system reliability and secure control logic."
      ]
    }
  ];

  const certData = [
    { title: "ISC2 CC", subtitle: "Cybersecurity", desc: "ISC2 Certified in Cybersecurity (In progress).", details: ["Pursuing foundational certification covering security principles, incident response, and network security concepts."] },
    { title: "PortSwigger", subtitle: "Web Security", desc: "Web Security Academy – Labs in SQLi and XSS.", details: ["Completed extensive hands-on labs focused on exploiting and mitigating Cross-Site Scripting (XSS) and SQL Injection vulnerabilities."] },
    { title: "AWS Academy", subtitle: "Cloud Infrastructure", desc: "Cloud Foundations and Cloud Architecture.", details: ["Trained in core AWS services, cloud security posture, identity access management, and scalable cloud architecture deployments."] },
    { title: "OCI Gen AI", subtitle: "Artificial Intelligence", desc: "Oracle Cloud Infrastructure Generative AI Professional.", details: ["Certified in deploying, managing, and securing large language models and generative AI workloads on Oracle Cloud."] },
    { title: "MIT IDSS", subtitle: "Data Science", desc: "Data Science and Machine Learning.", details: ["Completed coursework in statistical modeling, machine learning algorithms, and deep data analysis methodologies."] }
  ];

  const skillData = [
    { title: "SOC & SIEM", desc: "Splunk, Alert Triage, Incident Investigation.", details: ["Proficient in configuring Splunk, writing SPL queries, triaging alerts, and conducting deep-dive incident investigations."] },
    { title: "VAPT", desc: "Burp Suite, OWASP Top 10, Web App Testing.", details: ["Experienced in manual web application penetration testing using Burp Suite, focusing on the OWASP Top 10 vulnerabilities."] },
    { title: "Threat Intel", desc: "OSINT, IOC Analysis, Phishing Detection.", details: ["Skilled in gathering open-source intelligence, analyzing Indicators of Compromise (IOCs), and building custom threat detection logic."] },
    { title: "Technical", desc: "Python, Java, Wireshark, TCP/IP, DNS.", details: ["Strong foundational programming skills in Python and Java. Proficient in network traffic analysis using Wireshark and deep understanding of core protocols."] },
    { title: "Languages", desc: "English, Malayalam, Tamil, Hindi, French.", details: ["Multilingual communication capabilities supporting diverse operational environments and global threat intelligence gathering."] }
  ];

  return (
    <ReactLenis root>
      <div className="relative min-h-screen overflow-x-hidden cursor-none bg-paper">
        
        {/* INJECT CUSTOM CURSOR */}
        <CustomCursor />
        <ReactiveBlueprint />

        {/* --- PERSISTENT MENU BUTTON --- */}
        <button  
          onClick={() => setMenuOpen(!menuOpen)}
          className="fixed top-8 left-8 z-[200] w-12 h-12 border-2 border-ink bg-paper flex flex-col items-center justify-center gap-1 hover:bg-highlighter hover:text-paper transition-all duration-300 pointer-events-auto"
        >
          <motion.span animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6 : 0 }} className="w-6 h-[2px] bg-current" />
          <motion.span animate={{ opacity: menuOpen ? 0 : 1 }} className="w-6 h-[2px] bg-current" />
          <motion.span animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6 : 0 }} className="w-6 h-[2px] bg-current" />
        </button>

        {/* --- COMMAND MENU OVERLAY --- */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-paper/80 backdrop-blur-md flex items-center justify-center p-12 pointer-events-auto"
            >
              <div className="max-w-7xl w-full">
                <div className="flex justify-between items-end mb-12 border-b-2 border-ink pb-4">
                  <h2 className="font-serif text-6xl tracking-tighter">//COMMAND_CENTER</h2>
                  <span className="font-mono text-xs opacity-50 uppercase tracking-widest">[System Index]</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {menuItems.map((item, index) => (
                    <ProjectCard 
                      key={item.title} 
                      index={index} 
                      title={item.title} 
                      desc={item.desc} 
                      onClick={() => handleNav(item.id)} 
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- CARD DETAIL MODAL --- */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[300] bg-paper/80 backdrop-blur-md flex items-center justify-center p-6 md:p-12 pointer-events-auto cursor-pointer"
              onClick={() => setSelectedCard(null)}
            >
              <motion.div
                initial={{ y: 50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.4, ease: premiumEase }}
                onClick={(e) => e.stopPropagation()} 
                className="w-full max-w-4xl bg-paper border-4 border-ink p-8 md:p-16 shadow-[16px_16px_0px_0px_rgba(255,51,31,1)] relative flex flex-col max-h-[85vh] overflow-y-auto cursor-auto"
              >
                <div className="flex justify-between items-start mb-12 border-b-2 border-ink pb-6 gap-4">
                  <div>
                    <span className="font-mono text-xs font-bold text-highlighter uppercase tracking-[0.2em] block mb-2">
                      {selectedCard.subtitle || "System_Log_Data"}
                    </span>
                    <h2 className="font-serif text-5xl md:text-7xl uppercase tracking-tighter">
                      {selectedCard.title}
                    </h2>
                  </div>
                  <button 
                    onClick={() => setSelectedCard(null)}
                    className="font-mono text-sm md:text-base font-bold transition-colors border-2 px-3 py-2 hover:text-paper whitespace-nowrap flex-shrink-0 cursor-pointer border-ink hover:border-highlighter hover:bg-highlighter bg-transparent"
                    aria-label="Close Modal"
                  >
                    [ X ]
                  </button>
                </div>
                
                <div className="space-y-6">
                  <p className="font-mono text-sm md:text-base leading-relaxed opacity-80 uppercase tracking-widest mb-8 border-l-4 border-highlighter pl-4">
                    {selectedCard.desc}
                  </p>
                  
                  {selectedCard.details && selectedCard.details.map((point, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (idx * 0.1) }}
                      className="flex items-start gap-4"
                    >
                      <span className="font-mono text-highlighter mt-1">{`>`}</span>
                      <p className="font-mono text-sm md:text-base leading-relaxed opacity-90">{point}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-16 pt-6 border-t-2 border-ink/20 flex items-center gap-4 opacity-40">
                  <span className="w-3 h-3 bg-ink animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">End_Of_File</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {familyRevealed && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} transition={{ duration: 1.5, ease: premiumEase }} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full text-center">
              <p className="font-mono text-[8px] md:text-[10px] tracking-[0.3em] uppercase text-ink opacity-40">// Core Dependencies: Madhu, Nisha, Varshith</p>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="relative z-10 pointer-events-none">
          <div className="pointer-events-auto"><BrutalistPiano /></div>
          
          <header className="min-h-screen flex flex-col items-center justify-center px-6 relative">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 1.2 }} className="absolute top-24 md:top-28 right-6 md:right-12 flex items-center gap-3 z-40 pointer-events-auto">
              <a href="https://linkedin.com/in/varun-madhuraj" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-ink flex items-center justify-center text-ink bg-paper hover:bg-highlighter hover:border-highlighter hover:text-paper transition-all duration-300 cursor-pointer" aria-label="LinkedIn">
                <svg className="w-4 h-4 fill-current pointer-events-none" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://github.com/VarunMadhuraj" target="_blank" rel="noopener noreferrer" className="w-10 h-10 border-2 border-ink flex items-center justify-center text-ink bg-paper hover:bg-highlighter hover:border-highlighter hover:text-paper transition-all duration-300 cursor-pointer" aria-label="GitHub">
                <svg className="w-5 h-5 fill-current pointer-events-none" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="./Varun_Madhuraj_Resume.pdf" download className="h-10 px-4 border-2 border-ink flex items-center gap-2 text-ink bg-paper hover:bg-highlighter hover:text-paper transition-all duration-300 cursor-pointer pointer-events-auto">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:block pointer-events-none">Resume</span>
                <svg className="w-4 h-4 stroke-current pointer-events-none" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </a>
            </motion.div>

            <div className="w-full max-w-7xl flex flex-col items-center mt-16 pointer-events-auto">
              
              <h1 className="font-serif text-[15vw] md:text-[11vw] leading-[0.8] tracking-tighter w-full mb-16 flex flex-col items-center relative">
                <div className="text-left w-full overflow-hidden">
                  <motion.span initial={{ y: "100%" }} animate={{ y: 0 }} transition={{ duration: 1.2, ease: premiumEase }} className="block">
                    VARUN
                  </motion.span>
                </div>
                
                <div className="text-right w-full overflow-hidden whitespace-nowrap py-2 relative">
                  <motion.span 
                    initial={{ y: "100%" }} animate={{ y: 0 }} 
                    transition={{ duration: 1.2, ease: premiumEase, delay: 0.1 }}
                    className="block relative inline-block group"
                  >
                    MADHURAJ
                    
                    <span className="relative inline-block group/dot pointer-events-none">
                      <span className="text-ink group-hover/dot:text-highlighter transition-colors duration-500 relative z-10">
                        .
                      </span>
                      <span 
                        onClick={triggerFamilyEasterEgg}
                        className="absolute bottom-[5%] left-0 w-full h-[25%] pointer-events-auto cursor-pointer z-20"
                      ></span>
                    </span>

                  </motion.span>
                </div>
              </h1>
              
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6, ease: premiumEase }} className="flex flex-col md:flex-row gap-12 md:gap-16 items-start md:items-end justify-between w-full">
                <span className="group bg-highlighter text-paper px-6 py-2 font-bold text-xs md:text-sm uppercase tracking-tighter shadow-[4px_4px_0px_0px_rgba(28,28,28,1)] transition-all duration-300 cursor-default">
                  // THREAT INTELLIGE<span className="group-hover:text-ink transition-colors duration-500">N</span>CE // <span className="group-hover:text-ink transition-colors duration-500">S</span>OC OP<span className="group-hover:text-ink transition-colors duration-500">E</span>RATIONS // VAPT
                </span>
                <p className="max-w-md md:text-right text-[10px] md:text-xs font-bold leading-relaxed opacity-70 uppercase tracking-[0.2em]">Cybersecurity professional focused on defending environments through proactive monitoring and incident response.</p>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
              <span className="font-mono text-[8px] uppercase tracking-[0.4em] opacity-40">Scroll</span>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} className="w-[1px] h-10 bg-ink opacity-30" />
            </motion.div>
          </header>

          {/* --- CONTENT SECTIONS --- */}
          
          <section id="experience" className="max-w-7xl mx-auto px-6 pt-40 pointer-events-auto relative">
            <h2 className="font-serif text-6xl md:text-8xl uppercase tracking-tighter mb-20 border-b-2 border-ink pb-4">// EXPERIENCE</h2>
            <div className="max-w-4xl">
              {expData.map((data, index) => (
                <TimelineItem 
                  key={index}
                  index={index} 
                  date={data.date} 
                  title={data.title} 
                  subtitle={data.subtitle} 
                  desc={data.desc} 
                  onClick={() => setSelectedCard(data)}
                />
              ))}
            </div>
          </section>

          <section id="education" className="max-w-7xl mx-auto px-6 pt-40 pointer-events-auto relative">
            <h2 className="font-serif text-6xl md:text-8xl uppercase tracking-tighter mb-20 border-b-2 border-ink pb-4">// EDUCATION</h2>
            <div className="max-w-4xl">
               {eduData.map((data, index) => (
                <TimelineItem 
                  key={index}
                  index={index} 
                  date={data.date} 
                  title={data.title} 
                  subtitle={data.subtitle} 
                  desc={data.desc} 
                  onClick={() => setSelectedCard(data)}
                />
              ))}
            </div>
          </section>

          <section id="projects" className="max-w-7xl mx-auto px-6 pt-40 pointer-events-auto relative">
            <h2 className="font-serif text-6xl md:text-8xl uppercase tracking-tighter mb-20 border-b-2 border-ink pb-4">// PROJECTS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectData.map((data, index) => (
                <ProjectCard 
                  key={data.title}
                  index={index} 
                  title={data.title} 
                  subtitle={data.subtitle} 
                  desc={data.desc} 
                  onClick={() => setSelectedCard(data)}
                />
              ))}
            </div>
          </section>

          <section id="certs" className="max-w-7xl mx-auto px-6 pt-40 pointer-events-auto relative">
            <h2 className="font-serif text-6xl md:text-8xl uppercase tracking-tighter mb-20 border-b-2 border-ink pb-4">// CERTIFICATIONS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certData.map((data, index) => (
                <ProjectCard 
                  key={data.title}
                  index={index} 
                  title={data.title} 
                  subtitle={data.subtitle} 
                  desc={data.desc} 
                  onClick={() => setSelectedCard(data)}
                />
              ))}
            </div>
          </section>

          <section id="skills" className="max-w-7xl mx-auto px-6 pt-40 pointer-events-auto relative">
            <h2 className="font-serif text-6xl md:text-8xl uppercase tracking-tighter mb-20 border-b-2 border-ink pb-4">// SKILLS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skillData.map((data, index) => (
                <ProjectCard 
                  key={data.title}
                  index={index} 
                  title={data.title} 
                  desc={data.desc} 
                  onClick={() => setSelectedCard(data)}
                />
              ))}
            </div>
          </section>

          <div id="culture" className="max-w-7xl mx-auto px-6 pt-40 pb-40 pointer-events-auto">
            <motion.footer 
              initial={{ opacity: 0, y: 50 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, amount: 0.2 }} 
              transition={{ duration: 1, ease: premiumEase }} 
              className="bg-ink text-paper px-8 md:px-12 py-24 md:py-32 rounded-none mb-12 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-20 relative z-10">
                <h2 className="font-serif text-6xl md:text-8xl leading-none uppercase tracking-tighter">//CULTURE & ORGS</h2>
                <div className="text-right font-mono hidden md:block">
                  <p className="font-bold uppercase text-[10px] tracking-widest opacity-50 mb-2">Socials</p>
                  <ul className="text-2xl">
                    <li className="hover:text-highlighter cursor-pointer transition-colors"><a href="https://linkedin.com/in/varun-madhuraj" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                    <li className="hover:text-highlighter cursor-pointer transition-colors"><a href="https://github.com/VarunMadhuraj" target="_blank" rel="noopener noreferrer">GitHub</a></li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-end gap-8 relative z-10">
                <div className="max-w-3xl text-base md:text-lg leading-relaxed opacity-100 font-mono space-y-8">
                  <p>
                    <strong className="text-highlighter block mb-2 text-lg md:text-xl">ACM Student Chapter (VIT-AP):</strong> 
                    Head of External Affairs (Jan 2024 - Apr 2025) & Team Lead Documentation (Aug 2023 - Jan 2024). Managed industry relations, sponsorships, and ensured consistency of all written and visual documentation for chapter activities.
                  </p>
                  <p>
                    <strong className="text-highlighter block mb-2 text-lg md:text-xl">Music Club:</strong> 
                    Active musician, Pianist and Bassist for 'Not So Engineers'. Applying the same precision to security as I do to complex Carnatic metal fusion.
                  </p>
                </div>
                <span className="font-serif text-[15vw] md:text-[10vw] leading-none opacity-10 uppercase select-none tracking-tighter">2026</span>
              </div>
            </motion.footer>
          </div>

        </main>
      </div>
    </ReactLenis>
  );
}

export default App;