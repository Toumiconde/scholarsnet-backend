import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, Network, BarChart, BookOpen, ArrowRight, Shield, 
  Users, Book, Activity, Bell, TrendingUp, Clock, Server, 
  Database, Cpu, HardDrive, CheckCircle, AlertTriangle, Eye,
  FileText, MessageSquare, Heart, Settings, FolderOpen, Zap
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';

// ────────────────────────────────────────────────
//  VISITOR HOME — Unchanged original cards
// ────────────────────────────────────────────────
function VisitorHome() {
  const features = [
    { title: 'Moteur de Recherche', description: 'Explorez plus de 1000 publications scientifiques avec des filtres avancés.', icon: Search, path: '/search', color: 'from-blue-500 to-cyan-400' },
    { title: 'Réseau de Co-auteurs', description: "Visualisez les collaborations entre chercheurs de l'UGANC sous forme de graphe interactif.", icon: Network, path: '/network', color: 'from-purple-500 to-pink-500' },
    { title: 'Statistiques Labo', description: 'Analysez la production scientifique par laboratoire, par année et par type.', icon: BarChart, path: '/stats/LARI', color: 'from-orange-500 to-amber-400' },
    { title: 'Profils Chercheurs', description: 'Gérez votre profil académique, vos publications et calculez votre h-index.', icon: BookOpen, path: '/profile/CHR001', color: 'from-emerald-500 to-teal-400' }
  ];
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary text-sm font-medium mb-6">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          UGANC - Université Gamal Abdel Nasser
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
          Réseau Social <br />
          <span className="text-gradient">Académique</span>
        </h1>
        <p className="text-lg text-muted md:text-xl leading-relaxed">
          Centralisez, valorisez et analysez la production scientifique de vos chercheurs. 
          Une plateforme moderne propulsée par MongoDB et React.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.1 }}>
              <Link to={feature.path} className="block group h-full">
                <div className="glass-card p-8 h-full flex flex-col relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-[1px] mb-6 shadow-lg`}>
                    <div className="w-full h-full rounded-xl bg-surface flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-muted flex-1">{feature.description}</p>
                  <div className="mt-6 flex items-center gap-2 text-primary font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Explorer <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


// ────────────────────────────────────────────────
//  ADMIN COMMAND CENTER
// ────────────────────────────────────────────────
function AdminHome({ user }) {
  const [stats, setStats] = useState({ pubs: 0, chercheurs: 0, projets: 0, notifs: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now] = useState(new Date());

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [pubRes, chRes, notRes] = await Promise.allSettled([
          api.get('/publications'),
          api.get('/chercheurs'),
          api.get('/notifications')
        ]);
        const pubs = pubRes.status === 'fulfilled' ? (pubRes.value.data?.publications || pubRes.value.data || []) : [];
        const cher = chRes.status === 'fulfilled' ? (Array.isArray(chRes.value.data) ? chRes.value.data : chRes.value.data?.chercheurs || []) : [];
        const notifs = notRes.status === 'fulfilled' ? (Array.isArray(notRes.value.data) ? notRes.value.data : []) : [];

        setStats({
          pubs: Array.isArray(pubs) ? pubs.length : 0,
          chercheurs: cher.length,
          projets: 0,
          notifs: notifs.filter(n => !n.lu).length
        });
        setRecentActivity(notifs.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const getActivityIcon = (type) => {
    switch(type) {
      case 'connexion': return { icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'deconnexion': return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10' };
      case 'nouvelle_publication': return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' };
      case 'mise_a_jour': return { icon: Settings, color: 'text-amber-400', bg: 'bg-amber-500/10' };
      case 'reaction': return { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' };
      case 'commentaire': return { icon: MessageSquare, color: 'text-cyan-400', bg: 'bg-cyan-500/10' };
      case 'statut_publication': return { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'nouveau_chercheur': return { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' };
      default: return { icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10' };
    }
  };

  const quickActions = [
    { label: 'Publications', desc: 'Moteur de recherche', icon: Search, path: '/search', gradient: 'from-blue-600 to-cyan-500' },
    { label: 'Chercheurs', desc: 'Annuaire complet', icon: Users, path: '/admin', gradient: 'from-purple-600 to-pink-500' },
    { label: 'Réseau', desc: 'Graphe de co-auteurs', icon: Network, path: '/network', gradient: 'from-orange-500 to-red-500' },
    { label: 'Statistiques', desc: 'Analytics labo', icon: BarChart, path: '/stats/LARI', gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Projets', desc: 'Recherche en cours', icon: FolderOpen, path: '/admin', gradient: 'from-amber-500 to-yellow-500' },
    { label: 'Paramètres', desc: 'Config système', icon: Settings, path: '/admin', gradient: 'from-slate-500 to-zinc-500' },
  ];

  const systemHealth = [
    { label: 'API Server', status: 'online', icon: Server },
    { label: 'MongoDB', status: 'online', icon: Database },
    { label: 'CPU Usage', status: '23%', icon: Cpu },
    { label: 'Stockage', status: '1.2 GB', icon: HardDrive },
  ];

  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir';

  return (
    <div className="space-y-8">
      {/* ── Hero Header ── */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-[#0f172a] to-slate-900 p-8 md:p-10">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
                <Shield size={24} className="text-primary" />
              </div>
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">Console Administrateur</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
              {greeting}, <span className="text-gradient">{user?.prenom || 'Admin'}</span>
            </h1>
            <p className="text-muted text-sm max-w-lg">
              Bienvenue dans votre centre de commande ScholarsNet. Surveillez l'activité en temps réel, gérez les chercheurs et pilotez la production scientifique.
            </p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs text-muted font-mono">{now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div className="text-2xl font-black text-white font-mono mt-1">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </motion.div>

      {/* ── Live KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Publications', value: stats.pubs, icon: Book, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'from-blue-600/10 to-blue-900/5' },
          { label: 'Chercheurs', value: stats.chercheurs, icon: Users, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'from-purple-600/10 to-purple-900/5' },
          { label: 'Non lues', value: stats.notifs, icon: Bell, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'from-amber-600/10 to-amber-900/5' },
          { label: 'Uptime', value: '99.9%', icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'from-emerald-600/10 to-emerald-900/5' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`relative overflow-hidden bg-gradient-to-br ${kpi.bg} border ${kpi.border} rounded-2xl p-5 backdrop-blur-xl`}
          >
            <div className={`absolute -right-3 -bottom-3 opacity-[0.06] ${kpi.color}`}>
              <kpi.icon size={80} />
            </div>
            <div className="relative z-10">
              <div className={`p-2 rounded-xl bg-slate-900/50 border border-white/5 w-fit mb-3`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <h3 className="text-3xl font-black text-white tracking-tight">{loading ? '—' : kpi.value}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid: Actions + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Actions — 3 cols */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3 space-y-5">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-white">Accès Rapide</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action, i) => (
              <Link key={i} to={action.path} className="group">
                <div className="relative overflow-hidden glass-panel p-5 rounded-2xl border border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.gradient} opacity-0 rounded-full blur-2xl group-hover:opacity-15 transition-opacity duration-500`} />
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} p-[1px] mb-3`}>
                    <div className="w-full h-full rounded-xl bg-surface flex items-center justify-center">
                      <action.icon size={18} className="text-white" />
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{action.label}</h4>
                  <p className="text-[11px] text-muted mt-0.5">{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* System Health */}
          <div className="glass-panel rounded-2xl border border-border/60 p-5">
            <div className="flex items-center gap-3 mb-4">
              <Server size={18} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Santé du Système</h3>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Tous les services sont opérationnels
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {systemHealth.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50 border border-border/40">
                  <item.icon size={16} className="text-muted" />
                  <div>
                    <div className="text-xs text-muted">{item.label}</div>
                    <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                      {item.status === 'online' && <CheckCircle size={12} />}
                      {item.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Activity Feed — 2 cols */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-2">
          <div className="glass-panel rounded-2xl border border-border/60 overflow-hidden h-full flex flex-col">
            <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between bg-surface/30">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-400" />
                <span className="text-sm font-bold text-white">Activité Récente</span>
              </div>
              <Link to="/admin" className="text-xs text-primary hover:underline font-semibold">
                Voir tout →
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[420px] divide-y divide-border/20">
              {loading ? (
                <div className="p-8 text-center text-muted text-sm">Chargement...</div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((notif, i) => {
                  const act = getActivityIcon(notif.type);
                  const ActIcon = act.icon;
                  return (
                    <div key={notif._id || i} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors flex gap-3 items-start">
                      <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${act.bg}`}>
                        <ActIcon size={14} className={act.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{notif.texte}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-muted font-mono">
                            {new Date(notif.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!notif.lu && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-muted text-sm italic flex flex-col items-center gap-3">
                  <Activity size={24} className="opacity-20" />
                  Aucune activité enregistrée
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ChercheurHome({ user }) {
  const { logout } = useAuth();
  const [stats, setStats] = useState({ hearts: 0, totalReactions: 0, pubsCount: 0 });
  const [publications, setPublications] = useState([]);
  const [expandedPubId, setExpandedPubId] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showTerms, setShowTerms] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Vérification des conditions d'utilisation
    const accepted = localStorage.getItem(`scholarsnet_terms_${user.uid}`);
    if (!accepted && user.role === 'chercheur') {
      setShowTerms(true);
    }
  }, [user]);

  const handleAcceptTerms = () => {
    localStorage.setItem(`scholarsnet_terms_${user.uid}`, 'true');
    setShowTerms(false);
  };

  const handleRefuseTerms = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir refuser ? Votre compte chercheur sera supprimé de manière définitive.")) {
      setIsDeleting(true);
      try {
        await api.delete(`/chercheurs/${user.uid}`);
        localStorage.removeItem(`scholarsnet_terms_${user.uid}`);
        logout();
        window.location.href = '/';
      } catch (err) {
        alert("Erreur lors de la suppression de votre compte : " + (err.response?.data?.message || err.message));
        setIsDeleting(false);
      }
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get(`/chercheurs/${user.uid}`);
        const pubs = data.publications || [];
        
        let hearts = 0;
        let totalReactions = 0;
        
        pubs.forEach(pub => {
          if (pub.reactions) {
            hearts += (pub.reactions.coeur || 0);
            totalReactions += Object.values(pub.reactions).reduce((sum, val) => sum + (val || 0), 0);
          }
        });
        
        setStats({ hearts, totalReactions, pubsCount: pubs.length });
        setPublications(pubs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const quickLinks = [
    { label: 'Mon Profil', icon: BookOpen, path: `/profile/${user?.uid}`, color: 'from-blue-500 to-cyan-400' },
    { label: 'Mon Réseau', icon: Network, path: '/network', color: 'from-purple-500 to-pink-500' },
    { label: 'Mes Archives', icon: FolderOpen, path: '/archive', color: 'from-amber-500 to-orange-400' },
    { label: 'Statistiques Labo', icon: BarChart, path: '/stats/LARI', color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">
          Bienvenue, <span className="text-gradient">{user?.prenom || user?.nom}</span>
        </h1>
        <p className="text-muted">Accédez rapidement à vos travaux, votre réseau de collaboration et vos statistiques.</p>
      </motion.div>

      {/* Statistiques rapides du chercheur */}
      {!loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex justify-center gap-4 flex-wrap max-w-3xl mx-auto mb-8">
          <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 border-pink-500/20 bg-pink-500/5">
            <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400">
              <Heart size={24} className="fill-current" />
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-white">{stats.hearts}</p>
              <p className="text-xs text-pink-400 font-bold uppercase tracking-wider">Cœurs Reçus</p>
            </div>
          </div>
          <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 border-blue-500/20 bg-blue-500/5">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
              <Zap size={24} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-white">{stats.totalReactions}</p>
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider">Interactions</p>
            </div>
          </div>
          <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-4 border-emerald-500/20 bg-emerald-500/5">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
              <BookOpen size={24} />
            </div>
            <div className="text-left">
              <p className="text-2xl font-black text-white">{stats.pubsCount}</p>
              <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Publications</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto mb-12">
        {quickLinks.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Link to={link.path} className="block group">
                <div className="glass-card p-7 text-center relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-28 h-28 bg-gradient-to-br ${link.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                  <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${link.color} p-[1px] mb-5 shadow-lg`}>
                    <div className="w-full h-full rounded-xl bg-surface flex items-center justify-center">
                      <Icon className="text-white" size={26} />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{link.label}</h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Mes Publications Récentes */}
      <div className="max-w-5xl mx-auto pb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <FileText className="text-primary" /> Mes Publications &amp; Participations
        </h2>
        <div className="space-y-4">
          {publications.map((pub, i) => {
            const totalReacts = pub.reactions ? Object.values(pub.reactions).reduce((a, b) => a + (b || 0), 0) : 0;
            const isExpanded = expandedPubId === pub.pid;
            return (
              <motion.div 
                key={pub.pid || i} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 + i * 0.05 }} 
                className={`glass-panel p-5 rounded-2xl border transition-all cursor-pointer ${isExpanded ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/30'}`}
                onClick={() => setExpandedPubId(isExpanded ? null : pub.pid)}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 truncate">{pub.titre}</h3>
                    <div className="flex gap-3 text-sm text-muted">
                      <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded-md bg-white/5">{pub.type}</span>
                      <span>{pub.annee}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <button className="px-4 py-2 bg-surface border border-border hover:bg-white/5 rounded-xl text-sm text-white font-medium transition-colors flex items-center gap-2">
                      <Heart size={16} className={isExpanded ? "text-pink-500 fill-current" : "text-muted"} /> 
                      {isExpanded ? "Masquer" : "Voir les réactions"}
                    </button>
                  </div>
                </div>

                {/* Section d'expansion des réactions */}
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="mt-5 pt-5 border-t border-border/50 flex flex-wrap gap-3 items-center"
                  >
                    <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/10">
                      Total Réactions Combinées : {totalReacts}
                    </span>
                    
                    {pub.reactions?.coeur > 0 && <span className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg text-sm font-medium">❤️ {pub.reactions.coeur} Cœurs</span>}
                    {pub.reactions?.pouce > 0 && <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium">👍 {pub.reactions.pouce} J'aime</span>}
                    {pub.reactions?.feu > 0 && <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-sm font-medium">🔥 {pub.reactions.feu} Impressionnant</span>}
                    {pub.reactions?.surpris > 0 && <span className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium">😮 {pub.reactions.surpris} Surpris</span>}
                    {pub.reactions?.bravo > 0 && <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg text-sm font-medium">👏 {pub.reactions.bravo} Bravo</span>}
                    
                    {totalReacts === 0 && (
                      <span className="text-sm text-muted italic ml-2">Aucune réaction spécifique pour le moment.</span>
                    )}

                    <Link to={`/publication/${pub.pid}`} className="ml-auto text-sm text-primary hover:underline font-medium">
                      Voir la publication complète →
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          {publications.length === 0 && !loading && (
            <div className="p-8 text-center text-muted italic glass-panel rounded-2xl border border-border">
              Aucune publication ou participation trouvée.
            </div>
          )}
        </div>
      </div>

      {/* Modal Conditions d'utilisation */}
      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel w-full max-w-4xl max-h-[90vh] bg-surface border border-border rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-border bg-primary/5 flex items-center gap-3">
              <Shield size={28} className="text-primary" />
              <h2 className="text-2xl font-black text-white tracking-tight">Conditions d'Utilisation - ScholarsNet Académique</h2>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6 flex-1 text-muted">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
                <p className="text-amber-400 font-bold flex items-center gap-2">
                  <AlertTriangle size={18} /> AVERTISSEMENT IMPORTANT
                </p>
                <p className="text-sm mt-2 text-amber-400/80">Veuillez lire attentivement ces conditions. En cas de refus, votre compte chercheur sera supprimé de notre base de données de manière irréversible.</p>
              </div>

              <h3 className="text-xl font-bold text-white">1. Objectif de la plateforme</h3>
              <p>ScholarsNet Académique est un espace strictement dédié à l'apprentissage, à la recherche scientifique et au partage de connaissances. En rejoignant ce réseau, vous vous engagez à contribuer de manière positive à cet écosystème destiné à nos étudiants et chercheurs.</p>

              <h3 className="text-xl font-bold text-white">2. Règles de conduite strictes</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Contenu explicite interdit :</strong> Le partage de documents, images ou propos à caractère explicite, pornographique ou violent est formellement interdit.</li>
                <li><strong>Respect mutuel :</strong> Toute forme d'injure, de harcèlement, de discours de haine ou de comportement discriminatoire entraînera un bannissement immédiat.</li>
                <li><strong>Critiques constructives :</strong> Les débats scientifiques sont encouragés, mais les mauvaises critiques gratuites et non fondées visant à rabaisser un pair sont proscrites.</li>
              </ul>

              <h3 className="text-xl font-bold text-white">3. Propriété intellectuelle</h3>
              <p>Vous vous engagez à ne partager que des travaux pour lesquels vous possédez les droits nécessaires ou qui sont dans le domaine public. Le plagiat est une violation grave des règles académiques.</p>

              <h3 className="text-xl font-bold text-white">4. Sanctions</h3>
              <p className="text-red-400 font-medium">Le non-respect de l'une de ces règles entraînera votre bannissement définitif de la plateforme ScholarsNet. Les administrateurs se réservent le droit de supprimer tout compte sans préavis.</p>
              
              <p className="pt-4 border-t border-border/50 italic">
                En acceptant ces termes, vous confirmez votre engagement à maintenir un environnement académique sain, respectueux et propice à l'excellence scientifique.
              </p>
            </div>

            <div className="p-6 border-t border-border bg-surface/80 flex justify-end gap-4 flex-wrap">
              <button 
                onClick={handleRefuseTerms}
                disabled={isDeleting}
                className="px-6 py-3 rounded-xl bg-surface border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Suppression..." : "Je refuse (Supprimer mon compte)"}
              </button>
              <button 
                onClick={handleAcceptTerms}
                className="px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25"
              >
                J'accepte les conditions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


// ────────────────────────────────────────────────
//  MAIN EXPORT — Route by role
// ────────────────────────────────────────────────
export default function Home() {
  const { user } = useAuth();

  if (!user) return <VisitorHome />;
  if (user.role === 'admin') return <AdminHome user={user} />;
  return <ChercheurHome user={user} />;
}
