import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';

const PremiumBackground = () => (
  <div className="absolute inset-0 bg-slate-50 z-0">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-indigo-500 opacity-20 blur-[100px]"></div>
  </div>
);

const PolishedAvatar = ({ activeField }: { activeField: 'email' | 'password' | 'none' }) => {
  const isPassword = activeField === 'password';
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });

  // Time-based greeting
  const hour = new Date().getHours();
  let greetingMsg = "Good evening! 👋";
  if (hour < 12) greetingMsg = "Good morning! 👋";
  else if (hour < 18) greetingMsg = "Good afternoon! 👋";

  // Highly accurate screen-relative eye tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Don't track if the password field is active (eyes are hidden anyway)
      if (isPassword || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Calculate how far pupils should move. The max radius for pupil movement is ~7px.
      // We scale the screen distance so they move smoothly towards the edge.
      const cappedDistance = Math.min(distance / 50, 7); 
      
      setEyeOffset({ 
        x: Math.cos(angle) * cappedDistance, 
        y: Math.sin(angle) * cappedDistance 
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPassword]);

  const moveX = isPassword ? 0 : eyeOffset.x;
  const moveY = isPassword ? 0 : eyeOffset.y;

  const leftPupilX = 85 + moveX;
  const leftPupilY = 95 + moveY;
  
  const rightPupilX = 145 + moveX;
  const rightPupilY = 95 + moveY;

  return (
    <div 
      ref={containerRef}
      className="w-64 h-64 relative mx-auto drop-shadow-2xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Interactive Speech Bubble */}
      <motion.div 
        initial={{ opacity: 0, y: 15, scale: 0.8 }}
        animate={{ 
          opacity: isHovered ? 1 : 0, 
          y: isHovered ? 0 : 15,
          scale: isHovered ? 1 : 0.8
        }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-indigo-900 px-5 py-2.5 rounded-2xl shadow-xl text-sm font-black whitespace-nowrap z-20 pointer-events-none border border-slate-100"
      >
        {isPassword ? "No peeking! 🙈" : greetingMsg}
        <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-slate-100"></div>
      </motion.div>

      <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id="gradient-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          <clipPath id="avatar-clip">
            <circle cx="120" cy="120" r="110" />
          </clipPath>
        </defs>

        {/* Glow behind Avatar (Removed from inside SVG boundary, keeping circle base) */}
        <circle cx="120" cy="120" r="110" fill="url(#gradient-bg)" />

        <g clipPath="url(#avatar-clip)">
          {/* Main Body / Scrubs */}
          <path d="M 30 240 C 30 150, 210 150, 210 240 Z" fill="#4f46e5" />
          <path d="M 120 180 L 90 240 L 150 240 Z" fill="#3730a3" /> {/* Shadow crease */}

          {/* Neck */}
          <rect x="100" y="120" width="40" height="30" fill="#fed7aa" />
          <path d="M 100 130 Q 120 150 140 130 L 140 150 L 100 150 Z" fill="#fdba74" />

          {/* Waving Right Arm (Hidden when password is typed) */}
          <motion.g
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: isPassword ? 100 : 0, opacity: isPassword ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <motion.g
              animate={{ rotate: (isHovered && !isPassword) ? [0, 20, -10, 20, 0] : 0 }}
              transition={{ rotate: { repeat: (isHovered && !isPassword) ? Infinity : 0, duration: 1, ease: "easeInOut" } }}
              style={{ transformOrigin: '180px 190px' }}
            >
              <path d="M 175 190 Q 215 195, 205 130" fill="none" stroke="#4f46e5" strokeWidth="26" strokeLinecap="round" />
              <circle cx="205" cy="130" r="15" fill="#fed7aa" />
              {/* Cuff */}
              <rect x="192" y="140" width="26" height="12" rx="4" fill="#3730a3" transform="rotate(-10 205 140)" />
            </motion.g>
          </motion.g>

          {/* Left Resting Arm (Hidden when password is typed) */}
          <motion.g
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: isPassword ? 100 : 0, opacity: isPassword ? 0 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <path d="M 65 190 Q 25 195, 35 240" fill="none" stroke="#4f46e5" strokeWidth="26" strokeLinecap="round" />
          </motion.g>

          {/* Face */}
          <rect x="70" y="50" width="100" height="90" rx="40" fill="#ffedd5" />
          
          {/* Ears */}
          <circle cx="65" cy="100" r="12" fill="#fed7aa" />
          <circle cx="175" cy="100" r="12" fill="#fed7aa" />

          {/* Surgical Cap */}
          <path d="M 60 70 C 60 -10, 180 -10, 180 70 C 180 80, 60 80, 60 70 Z" fill="#0d9488" />
          <path d="M 60 70 C 90 50, 150 50, 180 70 C 180 80, 60 80, 60 70 Z" fill="#0f766e" />

          {/* Whites of Eyes */}
          <circle cx="85" cy="95" r="14" fill="#ffffff" />
          <circle cx="145" cy="95" r="14" fill="#ffffff" />

          {/* Pupils */}
          <motion.circle animate={{ cx: leftPupilX, cy: leftPupilY }} transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }} r="6" fill="#0f172a" />
          <motion.circle animate={{ cx: rightPupilX, cy: rightPupilY }} transition={{ type: "spring", stiffness: 300, damping: 25, mass: 0.5 }} r="6" fill="#0f172a" />

          {/* Eyebrows */}
          <motion.path animate={{ d: isPassword ? "M 70 70 Q 85 60 100 70" : "M 70 75 Q 85 65 100 75" }} fill="none" stroke="#9a3412" strokeWidth="4" strokeLinecap="round" />
          <motion.path animate={{ d: isPassword ? "M 140 70 Q 155 60 170 70" : "M 140 75 Q 155 65 170 75" }} fill="none" stroke="#9a3412" strokeWidth="4" strokeLinecap="round" />

          {/* Surgical Mask */}
          <path d="M 70 110 L 170 110 C 170 160, 70 160, 70 110 Z" fill="#e0e7ff" />
          <path d="M 70 110 L 170 110 C 170 130, 70 130, 70 110 Z" fill="#c7d2fe" />
          <path d="M 65 100 L 75 115" stroke="#e0e7ff" strokeWidth="3" />
          <path d="M 175 100 L 165 115" stroke="#e0e7ff" strokeWidth="3" />

          {/* Clipboard Group (Completely off-screen by default, animates up to cover eyes) */}
          <motion.g 
            initial={{ y: 260 }}
            animate={{ y: isPassword ? -75 : 260 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            {/* Hands holding the board */}
            <circle cx="50" cy="180" r="18" fill="#fed7aa" />
            <circle cx="190" cy="180" r="18" fill="#fed7aa" />

            {/* Clipboard Board */}
            <rect x="55" y="140" width="130" height="150" rx="10" fill="#94a3b8" />
            <rect x="60" y="145" width="120" height="140" rx="6" fill="#f8fafc" />
            
            <rect x="100" y="130" width="40" height="15" rx="4" fill="#cbd5e1" />
            <rect x="110" y="125" width="20" height="8" rx="2" fill="#64748b" />

            <path d="M 75 170 L 165 170" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <path d="M 75 190 L 145 190" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <path d="M 75 210 L 165 210" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <path d="M 85 170 L 125 170" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
            <path d="M 85 190 L 105 190" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />

            {/* Thumb overlays */}
            <path d="M 40 170 C 40 160, 60 160, 60 170" fill="none" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />
            <path d="M 200 170 C 200 160, 180 160, 180 170" fill="none" stroke="#fdba74" strokeWidth="4" strokeLinecap="round" />
          </motion.g>
        </g>
      </svg>
    </div>
  );
};

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoginBlock, setIsLoginBlock] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState<'email' | 'password' | 'none'>('none');

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError('');
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || "Google Login failed");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    try {
      if (isLoginBlock) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      const msg = err.message || "Authentication failed";
      if (msg.includes("invalid-credential")) {
        setError("Invalid email or password.");
      } else if (msg.includes("email-already-in-use")) {
        setError("Email is already registered.");
      } else {
        setError(msg);
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-8 z-0">
      <PremiumBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[1040px] flex flex-col lg:flex-row bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 box-border border border-slate-100"
      >
        {/* LEFT SIDE: Brand & Polished Illustration */}
        <div className="w-full lg:w-5/12 bg-[#0A0F24] p-10 flex flex-col justify-between relative overflow-hidden">
          {/* Decorative background abstract */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-indigo-600/20 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl"></div>
          </div>

          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shrink-0 shadow-lg border-2 border-indigo-500/20 overflow-hidden p-0.5">
              <img src="/logo-1.png" className="w-[120%] h-[120%] object-cover" alt="Logo" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{t('collegeNameShort')}</h2>
              <p className="text-indigo-200/80 text-xs font-medium mt-1 uppercase tracking-wider">{t('deptName')}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center z-10 py-12">
            <PolishedAvatar activeField={activeField} />
            <div className="mt-8 text-center max-w-xs">
              <h3 className="text-white font-bold text-lg mb-2">Smart Security</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your medical credentials are cryptographically protected. We strictly maintain HIPAA & institutional compliance.
              </p>
            </div>
          </div>

          <div className="z-10 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">Encrypted Connection</p>
              <p className="text-slate-400 text-xs">End-to-end data security active</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Polished Form */}
        <div className="w-full lg:w-7/12 bg-white p-8 sm:p-14 lg:p-16 flex flex-col justify-center">
          <div className="max-w-[400px] w-full mx-auto">
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {isLoginBlock ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-slate-500 font-medium mb-8">
              {isLoginBlock ? 'Enter your credentials to access the secure portal.' : 'Register a new profile for portal access.'}
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-0.5">!</div>
                {error}
              </motion.div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-5 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="email" 
                    placeholder="doctor@hospital.edu" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setActiveField('email')}
                    onBlur={() => setActiveField('none')}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300 bg-slate-50 focus:bg-white shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-900">Password</label>
                  {isLoginBlock && (
                    <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot password?</button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setActiveField('password')}
                    onBlur={() => setActiveField('none')}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 outline-none transition-all font-medium text-slate-900 placeholder:text-slate-300 bg-slate-50 focus:bg-white shadow-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                onMouseEnter={() => setActiveField('none')}
                className="w-full py-4 mt-4 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10 hover:shadow-indigo-600/20 active:scale-[0.98] group"
              >
                {isLoginBlock ? "Sign In Securely" : "Register Account"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-bold">or continue with</span>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveField('none');
                handleGoogleLogin();
              }}
              type="button"
              className="w-full flex items-center justify-center gap-3 py-4 px-4 rounded-2xl border-2 border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all font-bold text-slate-700 active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <p className="text-center mt-8 text-sm font-bold text-slate-500">
              {isLoginBlock ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => setIsLoginBlock(!isLoginBlock)}
                className="text-indigo-600 hover:text-indigo-700 underline underline-offset-4 decoration-indigo-600/30 hover:decoration-indigo-600 transition-colors"
              >
                {isLoginBlock ? 'Apply for access' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
