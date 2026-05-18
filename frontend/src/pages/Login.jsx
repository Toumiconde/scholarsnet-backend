import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldAlert, UserCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Identifiants incorrects ou serveur injoignable.');
    }
  };

  const handleDemo = (role) => {
    demoLogin(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center relative pt-12 sm:pt-0">
      <Link to="/" className="absolute top-4 left-4 sm:top-0 sm:-left-24 lg:-left-32 flex items-center gap-2 text-muted hover:text-white transition-colors bg-surface/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
        <ArrowLeft size={20} />
        <span className="font-medium">Retour</span>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <span className="text-white font-bold text-3xl leading-none tracking-tighter">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Connexion</h1>
          <p className="text-muted">Accédez à votre espace ScholarsNet</p>
        </div>

        <div className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm text-muted mb-1">Email académique</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="m.conde@uganc.edu"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-muted mb-1">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25 mt-6">
              Se connecter
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted text-center mb-4">Accès rapide pour la soutenance (Démo) :</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleDemo('chercheur')} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-surface border border-border text-white hover:bg-white/5 transition-colors">
                <UserCheck size={16} className="text-emerald-400" />
                Se connecter en tant que Chercheur
              </button>
              <button onClick={() => handleDemo('admin')} className="flex items-center justify-center gap-2 py-2 rounded-lg bg-surface border border-border text-white hover:bg-white/5 transition-colors">
                <ShieldAlert size={16} className="text-pink-400" />
                Se connecter en tant qu'Admin
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
