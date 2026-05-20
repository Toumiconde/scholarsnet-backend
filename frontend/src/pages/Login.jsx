import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ShieldAlert, UserCheck, ArrowLeft, Key, User, BookOpen, Globe } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'register'
  
  // Registration States
  const [regUid, setRegUid] = useState('');
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLabo, setRegLabo] = useState('LARI');
  const [regGrade, setRegGrade] = useState('Doctorant');
  const [regDomaines, setRegDomaines] = useState('');
  const [regLangues, setRegLangues] = useState('Français');
  const [regPassword, setRegPassword] = useState('');
  
  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [simulatedLink, setSimulatedLink] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, demoLoginCustom } = useAuth();
  const navigate = useNavigate();

  const demoProfiles = [
    { uid: 'CHR001', nom: 'Condé', prenom: 'Mamadou Alpha', email: 'm.conde@uganc.edu', role: 'chercheur', laboratoire: 'LARI', grade: 'Professeur', label: '🎓 Prof. Mamadou Alpha CONDÉ (CHR001)' },
    { uid: 'CHR002', nom: 'Diallo', prenom: 'Fatoumata', email: 'f.diallo@uganc.edu', role: 'chercheur', laboratoire: 'LARI', grade: 'Maître de conférences', label: '🎓 Dr. Fatoumata DIALLO (CHR002)' },
    { uid: 'CHR004', nom: 'Auteur 4', prenom: 'Auteur', email: 'a4@uganc.edu', role: 'chercheur', laboratoire: 'LARI', grade: 'Maître de conférences', label: '🎓 Auteur 4 (Chercheur - CHR004)' },
    { uid: 'CHR005', nom: 'Auteur 5', prenom: 'Auteur', email: 'a5@uganc.edu', role: 'chercheur', laboratoire: 'LARI', grade: 'Maître de conférences', label: '🎓 Auteur 5 (Chercheur - CHR005)' },
    { uid: 'CHR006', nom: 'Auteur 6', prenom: 'Auteur', email: 'a6@uganc.edu', role: 'chercheur', laboratoire: 'LARI', grade: 'Maître de conférences', label: '🎓 Auteur 6 (Chercheur - CHR006)' },
    { uid: 'CHR009', nom: 'Auteur 9', prenom: 'Auteur', email: 'a9@uganc.edu', role: 'chercheur', laboratoire: 'LARI', grade: 'Professeur', label: '🎓 Auteur 9 (Chercheur - CHR009)' },
    { uid: 'ADM001', nom: 'Admin', prenom: 'Système', email: 'admin@uganc.edu', role: 'admin', laboratoire: 'DSI', grade: 'Technicien', label: '🛡️ Administrateur Système (ADM001)' }
  ];

  const [selectedProfileUid, setSelectedProfileUid] = useState('CHR001');

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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');
    setSimulatedLink('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMessage(data.message);
      if (data.resetLink) {
        setSimulatedLink(data.resetLink);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const domainsArray = regDomaines.split(',').map(d => d.trim()).filter(Boolean);
      const languagesArray = regLangues.split(',').map(l => l.trim()).filter(Boolean);

      const payload = {
        uid: regUid.toUpperCase().trim(),
        nom: regNom.trim(),
        prenom: regPrenom.trim(),
        email: regEmail.trim(),
        laboratoire: regLabo.trim(),
        grade: regGrade,
        domaines_recherche: domainsArray,
        langues: languagesArray,
        password: regPassword
      };

      const { data } = await api.post('/auth/register', payload);
      
      // Enregistrer avec succès, passer en mode connexion et pré-remplir l'email
      setEmail(regEmail.trim());
      setMode('login');
      alert(`Compte chercheur créé avec succès ! Identifiant : ${data.uid}. Vous pouvez maintenant vous connecter.`);
      
      // Reset registration form fields
      setRegUid('');
      setRegNom('');
      setRegPrenom('');
      setRegEmail('');
      setRegPassword('');
      setRegDomaines('');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Une erreur est survenue lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDemoLogin = () => {
    const profile = demoProfiles.find(p => p.uid === selectedProfileUid);
    if (profile) {
      const { label, ...profileData } = profile;
      demoLoginCustom(profileData);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center relative pt-12 sm:pt-6 pb-12">
      <Link to="/" className="absolute top-4 left-4 sm:top-0 sm:-left-24 lg:-left-32 flex items-center gap-2 text-muted hover:text-white transition-colors bg-surface/50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
        <ArrowLeft size={20} />
        <span className="font-medium">Retour</span>
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className={`w-full relative transition-all duration-500 ${mode === 'register' ? 'max-w-2xl' : 'max-w-md'}`}
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <span className="text-white font-bold text-3xl leading-none tracking-tighter">S</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {mode === 'login' && 'Connexion'}
            {mode === 'forgot' && 'Mot de passe oublié'}
            {mode === 'register' && 'Rejoindre ScholarsNet'}
          </h1>
          <p className="text-muted">
            {mode === 'login' && 'Accédez à votre espace ScholarsNet'}
            {mode === 'forgot' && 'Récupérez l\'accès à votre compte chercheur'}
            {mode === 'register' && 'Créez votre profil chercheur académique complet'}
          </p>
        </div>

        <div className="glass-panel p-8 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm text-muted">Mot de passe</label>
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25 mt-6">
                Se connecter
              </button>

              <div className="text-center mt-4 pt-2">
                <span className="text-sm text-muted font-medium">Nouveau sur la plateforme ? </span>
                <button 
                  type="button" 
                  onClick={() => { setMode('register'); setError(''); }}
                  className="text-sm text-primary font-bold hover:underline"
                >
                  Créer un compte chercheur
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgotMessage && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm space-y-2">
                  <p>{forgotMessage}</p>
                  {simulatedLink && (
                    <div className="pt-2 border-t border-emerald-500/20">
                      <p className="text-[10px] text-muted mb-2">Simulateur local (Soutenance) :</p>
                      <button 
                        type="button"
                        onClick={() => {
                          const token = simulatedLink.split('/').pop();
                          navigate(`/reset-password/${token}`);
                        }}
                        className="w-full py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors text-xs flex items-center justify-center gap-1"
                      >
                        <Key size={14} /> Accéder au lien de réinitialisation
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm text-muted mb-1">Email de votre compte chercheur</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                  <input 
                    type="email" 
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="m.conde@uganc.edu"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => { setMode('login'); setError(''); setForgotMessage(''); }}
                  className="flex-1 py-3 rounded-xl bg-surface border border-border text-muted font-bold hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-secondary text-white font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-secondary/25"
                >
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identifiant UID */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase">Identifiant unique (UID)</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input 
                      type="text" 
                      value={regUid}
                      onChange={(e) => setRegUid(e.target.value)}
                      className="w-full bg-surface/50 border border-border rounded-xl py-2.5 pl-9 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Ex: CHR010"
                      required
                    />
                  </div>
                </div>

                {/* Grade académique */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase">Grade Académique</label>
                  <select 
                    value={regGrade}
                    onChange={(e) => setRegGrade(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="Doctorant" className="bg-surface text-white">Doctorant</option>
                    <option value="Maître de conférences" className="bg-surface text-white">Maître de conférences</option>
                    <option value="Professeur" className="bg-surface text-white">Professeur</option>
                  </select>
                </div>

                {/* Prénom */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase">Prénom</label>
                  <input 
                    type="text" 
                    value={regPrenom}
                    onChange={(e) => setRegPrenom(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Ex: Amadou"
                    required
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase">Nom de famille</label>
                  <input 
                    type="text" 
                    value={regNom}
                    onChange={(e) => setRegNom(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Ex: Diallo"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase">Email académique</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                    <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-surface/50 border border-border rounded-xl py-2.5 pl-9 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Ex: a.diallo@uganc.edu"
                      required
                    />
                  </div>
                </div>

                {/* Laboratoire */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase">Laboratoire de Recherche</label>
                  <input 
                    type="text" 
                    value={regLabo}
                    onChange={(e) => setRegLabo(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Ex: LARI"
                    required
                  />
                </div>

                {/* Domaines de Recherche */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase flex items-center gap-1">
                    <BookOpen size={12} /> Domaines de recherche (séparés par virgules)
                  </label>
                  <input 
                    type="text" 
                    value={regDomaines}
                    onChange={(e) => setRegDomaines(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Intelligence Artificielle, Big Data, Vision"
                  />
                </div>

                {/* Langues */}
                <div>
                  <label className="block text-xs text-muted mb-1 font-semibold uppercase flex items-center gap-1">
                    <Globe size={12} /> Langues parlées (séparées par virgules)
                  </label>
                  <input 
                    type="text" 
                    value={regLangues}
                    onChange={(e) => setRegLangues(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Français, Anglais"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="pt-2">
                <label className="block text-xs text-muted mb-1 font-semibold uppercase">Mot de passe de connexion</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input 
                    type="password" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-surface/50 border border-border rounded-xl py-2.5 pl-9 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="•••••••• (Min. 6 caractères)"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setMode('login'); setError(''); }}
                  className="flex-1 py-3 rounded-xl bg-surface border border-border text-muted font-bold hover:text-white transition-colors"
                >
                  Retour
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
                >
                  {loading ? 'Création...' : 'S\'inscrire'}
                </button>
              </div>
            </form>
          )}

          {mode !== 'register' && (
            <div className="pt-6 border-t border-border space-y-4">
              <div>
                <p className="text-sm font-semibold text-white mb-1">Mode Démonstration (Soutenance)</p>
                <p className="text-xs text-muted">Sélectionnez le chercheur ou administrateur de votre choix pour tester les droits d'édition.</p>
              </div>
              
              <div className="space-y-3">
                <select
                  value={selectedProfileUid}
                  onChange={(e) => setSelectedProfileUid(e.target.value)}
                  className="w-full bg-surface/50 border border-border rounded-xl py-3 px-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {demoProfiles.map(p => (
                    <option key={p.uid} value={p.uid} className="bg-surface text-white">
                      {p.label}
                    </option>
                  ))}
                </select>

                <button 
                  onClick={handleCustomDemoLogin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-400 font-semibold hover:from-emerald-500/20 hover:to-teal-500/20 transition-all shadow-md shadow-emerald-500/5"
                >
                  <UserCheck size={18} /> Accéder avec ce profil
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
