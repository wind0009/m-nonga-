
import React, { useState } from 'react';
import { User, Gender } from '../types';
import { api } from '../services/api';
import { INTERESTS_LIST } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
}

type Step = 'method' | 'phone' | 'otp' | 'name' | 'gender' | 'location' | 'interests';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<Step>('method');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data pour Onboarding
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    age: 20,
    gender: Gender.FEMALE,
    city: 'Ouagadougou',
    district: '',
    interests: [],
    bio: '',
    occupation: ''
  });

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 8) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) document.getElementById(`otp-${index + 1}`)?.focus();
    if (newOtp.every(digit => digit !== '')) handleVerify(newOtp.join(''));
  };

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    try {
      const user = await api.getUser(phone);
      setIsLoading(false);
      if (user) {
        onLogin(user);
      } else {
        setStep('name');
      }
    } catch (e) {
      setIsLoading(false);
      setStep('name'); // Fallback vers création
    }
  };

  const finalizeSignup = async () => {
    setIsLoading(true);
    try {
      const newUser: User = {
        id: `user_${phone}`,
        name: formData.name || 'Anonyme',
        age: formData.age || 20,
        city: formData.city || 'Ouagadougou',
        district: formData.district || 'Secteur',
        occupation: formData.occupation || 'Membre M\'nonga',
        bio: formData.bio || `Salut ! Je suis ${formData.name}.`,
        interests: formData.interests || [],
        photos: [`https://picsum.photos/id/${Math.floor(Math.random() * 500)}/600/800`],
        gender: formData.gender || Gender.OTHER
      };
      await api.saveProfile(newUser);
      onLogin(newUser);
    } catch (e) {
      alert("Erreur lors de la création du profil. Réessaye.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests?.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...(prev.interests || []), interest]
    }));
  };

  // --- RENDERS ---

  const renderMethod = () => (
    <div className="space-y-4 w-full max-w-sm mx-auto animate-in slide-in-from-bottom duration-500">
      <div className="text-center mb-8">
        <h2 className="text-white text-lg font-medium opacity-90">Bienvenue sur M'nonga</h2>
        <p className="text-white/60 text-xs mt-1">L'app de rencontre 100% Faso 🇧🇫</p>
      </div>
      <button onClick={() => setStep('phone')} className="w-full bg-white text-gray-900 h-14 rounded-full font-bold flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all active:scale-95">
        <i className="fa-solid fa-phone text-[#e94057]"></i>
        CONNEXION NUMÉRO
      </button>
      <button onClick={() => setStep('name')} className="w-full bg-black/20 text-white border border-white/20 h-14 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-black/30 transition-all">
        <i className="fa-brands fa-google"></i>
        COMPTE GOOGLE
      </button>
    </div>
  );

  const renderPhone = () => (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-in slide-in-from-right">
      <div className="text-center text-white mb-8">
        <h2 className="text-2xl font-bold mb-2">Ton Numéro ?</h2>
        <p className="text-sm opacity-80">Indispensable pour sécuriser ton compte.</p>
      </div>
      <form onSubmit={handlePhoneSubmit} className="space-y-4">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white">
          <span className="font-bold border-r border-white/20 pr-3">+226</span>
          <input type="tel" placeholder="Numéro de téléphone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="bg-transparent flex-1 outline-none text-lg font-semibold" autoFocus />
        </div>
        <button disabled={phone.length < 8 || isLoading} className="w-full bg-white text-gray-900 h-14 rounded-full font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
          {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'CONTINUER'}
        </button>
      </form>
    </div>
  );

  const renderName = () => (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-in slide-in-from-right text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black">Comment t'appelles-tu ?</h2>
        <p className="text-sm opacity-60">Ton nom sera affiché sur ton profil.</p>
      </div>
      <div className="space-y-4">
        <input 
          type="text" 
          placeholder="Ton prénom"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="w-full bg-white/10 border border-white/30 rounded-2xl p-5 text-xl font-bold outline-none focus:bg-white/20"
        />
        <div className="flex items-center gap-4">
          <label className="font-bold opacity-60">Âge :</label>
          <input 
            type="number" 
            min="18" max="99"
            value={formData.age}
            onChange={e => setFormData({...formData, age: parseInt(e.target.value) || 18})}
            className="w-20 bg-white/10 border border-white/30 rounded-xl p-3 text-center font-bold outline-none"
          />
        </div>
        <button 
          disabled={!formData.name || (formData.age || 0) < 18}
          onClick={() => setStep('gender')}
          className="w-full bg-white text-gray-900 h-14 rounded-full font-bold shadow-xl active:scale-95 disabled:opacity-50"
        >
          SUIVANT
        </button>
      </div>
    </div>
  );

  const renderGender = () => (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-in slide-in-from-right text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black">Tu es...</h2>
      </div>
      <div className="grid gap-3">
        {[Gender.FEMALE, Gender.MALE, Gender.OTHER].map(g => (
          <button 
            key={g}
            onClick={() => setFormData({...formData, gender: g})}
            className={`w-full p-5 rounded-2xl font-bold text-lg border-2 transition-all ${formData.gender === g ? 'bg-white text-red-500 border-white' : 'border-white/20 hover:bg-white/5'}`}
          >
            {g}
          </button>
        ))}
        <button onClick={() => setStep('location')} className="mt-4 w-full bg-white text-gray-900 h-14 rounded-full font-bold shadow-xl">CONTINUER</button>
      </div>
    </div>
  );

  const renderLocation = () => (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-in slide-in-from-right text-white">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black">Où habites-tu ?</h2>
      </div>
      <div className="space-y-4">
        <select 
          value={formData.city}
          onChange={e => setFormData({...formData, city: e.target.value})}
          className="w-full bg-white/10 border border-white/30 rounded-2xl p-5 font-bold outline-none appearance-none"
        >
          <option value="Ouagadougou" className="text-gray-900">Ouagadougou 🇧🇫</option>
          <option value="Bobo-Dioulasso" className="text-gray-900">Bobo-Dioulasso 🇧🇫</option>
          <option value="Koudougou" className="text-gray-900">Koudougou 🇧🇫</option>
        </select>
        <input 
          type="text" 
          placeholder="Ton quartier (ex: Ouaga 2000, Pissy...)"
          value={formData.district}
          onChange={e => setFormData({...formData, district: e.target.value})}
          className="w-full bg-white/10 border border-white/30 rounded-2xl p-5 text-lg font-bold outline-none"
        />
        <button onClick={() => setStep('interests')} className="w-full bg-white text-gray-900 h-14 rounded-full font-bold shadow-xl">SUIVANT</button>
      </div>
    </div>
  );

  const renderInterests = () => (
    <div className="space-y-6 w-full max-w-sm mx-auto animate-in slide-in-from-right text-white h-[80vh] flex flex-col">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-black">Tes Intérêts</h2>
        <p className="text-sm opacity-60">Choisis au moins 3 trucs que tu aimes.</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide flex flex-wrap gap-2 content-start">
        {INTERESTS_LIST.map(interest => (
          <button 
            key={interest}
            onClick={() => toggleInterest(interest)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.interests?.includes(interest) ? 'bg-white text-red-500 border-white' : 'border-white/20'}`}
          >
            {interest}
          </button>
        ))}
      </div>
      <button 
        disabled={isLoading || (formData.interests?.length || 0) < 3}
        onClick={finalizeSignup}
        className="w-full bg-white text-gray-900 h-14 rounded-full font-black shadow-2xl mt-4 flex items-center justify-center gap-2"
      >
        {isLoading ? <i className="fa-solid fa-circle-notch animate-spin"></i> : 'BARKÉ ! (TERMINER)'}
      </button>
    </div>
  );

  return (
    <div className="relative h-screen w-full flex flex-col justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 rose-gradient"></div>
      
      {/* Background patterns */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>

      <div className="relative z-10 w-full flex flex-col">
        {step === 'method' && renderMethod()}
        {step === 'phone' && renderPhone()}
        {step === 'otp' && (
          <div className="space-y-8 text-center animate-in zoom-in duration-300">
             <h2 className="text-white text-2xl font-bold">Vérification...</h2>
             <div className="flex justify-center gap-4">
               {otp.map((d, i) => (
                 <input key={i} id={`otp-${i}`} type="number" value={d} onChange={e => handleOtpChange(i, e.target.value)} className="w-14 h-16 bg-white/10 border border-white/30 rounded-2xl text-center text-2xl font-bold text-white outline-none" />
               ))}
             </div>
             {isLoading && <i className="fa-solid fa-heart animate-pulse text-white text-4xl"></i>}
          </div>
        )}
        {step === 'name' && renderName()}
        {step === 'gender' && renderGender()}
        {step === 'location' && renderLocation()}
        {step === 'interests' && renderInterests()}
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 text-center">
        <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em]">M'nonga v1.1 - Faso Love 🇧🇫</p>
      </div>
    </div>
  );
};

export default Login;
