
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (userData?: Partial<User>) => void;
}

type AuthStep = 'method' | 'phone' | 'otp';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<AuthStep>('method');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) return;
    setIsLoading(true);
    // Simulating API call to send OTP
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    // Check if OTP is complete
    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleVerify = (code: string) => {
    setIsLoading(true);
    // Simulating API verification
    setTimeout(() => {
      setIsLoading(false);
      onLogin(); // Success!
    }, 2000);
  };

  const renderMethodStep = () => (
    <div className="space-y-4 w-full max-w-sm mx-auto animate-in slide-in-from-bottom duration-500">
      <p className="text-[11px] text-white/80 text-center mb-6 leading-relaxed px-4">
        En cliquant sur Connexion, tu acceptes nos <span className="underline font-semibold">Conditions d'utilisation</span>. Apprends comment nous traitons tes données dans notre <span className="underline font-semibold">Politique de confidentialité</span>.
      </p>
      
      <button 
        onClick={() => setStep('phone')}
        className="w-full bg-white text-gray-900 h-14 rounded-full font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-gray-100 transition-all active:scale-95"
      >
        <i className="fa-solid fa-phone text-[#e94057]"></i>
        CONNEXION AVEC UN NUMÉRO
      </button>
      
      <button 
        onClick={() => { setIsLoading(true); setTimeout(() => onLogin(), 1500); }}
        className="w-full bg-white/10 backdrop-blur-md border border-white/30 text-white h-14 rounded-full font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-white/20 transition-all active:scale-95"
      >
        <i className="fa-brands fa-google"></i>
        CONNEXION AVEC GOOGLE
      </button>

      <button 
        onClick={() => { setIsLoading(true); setTimeout(() => onLogin(), 1500); }}
        className="w-full bg-white/10 backdrop-blur-md border border-white/30 text-white h-14 rounded-full font-bold flex items-center justify-center gap-3 shadow-xl hover:bg-white/20 transition-all active:scale-95"
      >
        <i className="fa-brands fa-facebook-f"></i>
        CONNEXION AVEC FACEBOOK
      </button>
    </div>
  );

  const renderPhoneStep = () => (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-in slide-in-from-right duration-300">
      <div className="text-center text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Ton Numéro ?</h2>
        <p className="text-sm opacity-80">Nous t'enverrons un code de vérification.</p>
      </div>
      
      <form onSubmit={handlePhoneSubmit} className="space-y-6">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white">
          <span className="font-bold border-r border-white/20 pr-3">+226</span>
          <input 
            type="tel" 
            placeholder="Numéro de téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            className="bg-transparent flex-1 outline-none text-lg font-semibold placeholder:text-white/40"
            autoFocus
          />
        </div>
        
        <button 
          disabled={phone.length < 8 || isLoading}
          className="w-full bg-white text-gray-900 h-14 rounded-full font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
        >
          {isLoading ? (
            <i className="fa-solid fa-circle-notch animate-spin text-xl"></i>
          ) : (
            'CONTINUER'
          )}
        </button>
      </form>

      <button onClick={() => setStep('method')} className="w-full text-white text-sm font-semibold opacity-60">
        Retour
      </button>
    </div>
  );

  const renderOtpStep = () => (
    <div className="space-y-8 w-full max-w-sm mx-auto animate-in slide-in-from-right duration-300">
      <div className="text-center text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Code de Vérification</h2>
        <p className="text-sm opacity-80">Saisis le code envoyé au +226 {phone}</p>
      </div>

      <div className="flex justify-center gap-4">
        {otp.map((digit, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="number"
            value={digit}
            onChange={(e) => handleOtpChange(i, e.target.value)}
            className="w-14 h-16 bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl text-center text-2xl font-bold text-white outline-none focus:border-white transition-all"
            autoFocus={i === 0}
          />
        ))}
      </div>

      <div className="text-center space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <i className="fa-solid fa-circle-notch animate-spin text-3xl text-white"></i>
            <span className="text-white text-xs font-bold tracking-widest uppercase">Vérification...</span>
          </div>
        ) : (
          <button className="text-white text-sm font-semibold underline opacity-80">
            Renvoyer le code
          </button>
        )}
      </div>

      <button onClick={() => setStep('phone')} className="w-full text-white text-sm font-semibold opacity-60">
        Changer de numéro
      </button>
    </div>
  );

  return (
    <div className="relative h-screen w-full flex flex-col justify-between p-8 overflow-hidden">
      <div className="absolute inset-0 rose-gradient"></div>

      <div className="relative z-10 pt-12 flex flex-col items-center gap-4 text-white">
        <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl heart-beat">
          <i className="fa-solid fa-heart text-4xl text-white"></i>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">M'nonga</h1>
      </div>

      <div className="relative z-10 pb-12 flex items-center justify-center">
        {step === 'method' && renderMethodStep()}
        {step === 'phone' && renderPhoneStep()}
        {step === 'otp' && renderOtpStep()}
      </div>

      {/* Footer Text */}
      <div className="relative z-10 text-center">
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">
          Version 1.0.4 - Burkina Faso 🇧🇫
        </p>
      </div>
    </div>
  );
};

export default Login;
