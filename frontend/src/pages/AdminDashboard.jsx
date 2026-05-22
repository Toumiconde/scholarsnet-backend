import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ComposedChart, Line, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Users, BookOpen, Award, TrendingUp, Activity, ShieldCheck,
  Database, Bell, Settings, AlertTriangle, CheckCircle, Clock,
  UserPlus, FileText, Layers, RefreshCw, ChevronRight, Server, Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import api from '../lib/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({ publicationsTotales: 0, chercheursActifs: 0, citations: 0, croissance: '0%' });
  const [statsAnnee, setStatsAnnee] = useState({ evolution: [], pie: [] });
  const [chercheurs, setChercheurs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [resKpis, resAnnee, resChercheurs, resNotifs] = await Promise.all([
          api.get('/stats/kpis/LARI').catch(() => ({ data: { publicationsTotales: 0, chercheursActifs: 0, citations: 0, croissance: '0%' } })),
          api.get('/stats/labo/LARI').catch(() => ({ data: [] })),
          api.get('/chercheurs').catch(() => ({ data: [] })),
          api.get('/notifications').catch(() => ({ data: [] })),
        ]);

        setKpis(resKpis.data);

        const raw = resAnnee.data;
        const evolution = {};
        const typesCount = {};
        raw.forEach(item => {
          const year = item._id.annee;
          const type = item._id.type;
          if (!evolution[year]) evolution[year] = { name: String(year), total: 0, Article: 0, 'Conférence': 0, Autre: 0 };
          evolution[year].total += item.count;
          if (type === 'article') evolution[year].Article += item.count;
          else if (type === 'inproceedings') evolution[year]['Conférence'] += item.count;
          else evolution[year].Autre += item.count;
          typesCount[type] = (typesCount[type] || 0) + item.count;
        });
        const sortedEvol = Object.values(evolution).sort((a, b) => parseInt(a.name) - parseInt(b.name));
        const pie = Object.keys(typesCount).map((k, i) => ({ name: k.toUpperCase(), value: typesCount[k], fill: COLORS[i % COLORS.length] }));
        setStatsAnnee({ evolution: sortedEvol, pie });

        const list = Array.isArray(resChercheurs.data) ? resChercheurs.data : (resChercheurs.data.chercheurs || []);
        setChercheurs(list);

        const notifs = Array.isArray(resNotifs.data) ? resNotifs.data : [];
        setNotifications(notifs.slice(0, 6));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const admins = chercheurs.filter(c => c.role === 'admin');
  const researchers = chercheurs.filter(c => c.role !== 'admin');
  const activeResearchers = researchers.filter(c => c.actif !== false);
  const suspendedResearchers = researchers.filter(c => c.actif === false);

  const kpiCards = [
    {
      label: 'Publications Indexées',
      value: kpis.publicationsTotales,
      sub: 'Base de données DBLP',
      icon: BookOpen,
      gradient: 'from-blue-600/20 to-blue-900/10',
      border: 'border-blue-500/30',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Chercheurs Actifs',
      value: activeResearchers.length || kpis.chercheursActifs,
      sub: `${suspendedResearchers.length} compte(s) suspendu(s)`,
      icon: Users,
      gradient: 'from-violet-600/20 to-violet-900/10',
      border: 'border-violet-500/30',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-400',
      trend: '+2',
      trendUp: true,
    },
    {
      label: 'Citations Totales',
      value: kpis.citations,
      sub: 'Impact scientifique global',
      icon: Award,
      gradient: 'from-rose-600/20 to-rose-900/10',
      border: 'border-rose-500/30',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-400',
      trend: '+84',
      trendUp: true,
    },
    {
      label: 'Taux de Croissance',
      value: kpis.croissance,
      sub: 'Évolution annuelle des pubs',
      icon: TrendingUp,
      gradient: 'from-emerald-600/20 to-emerald-900/10',
      border: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      trend: 'Positif',
      trendUp: true,
    },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Server size={24} className="text-primary" />
        </div>
      </div>
      <p className="text-muted text-sm font-mono">Chargement du système...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      
      {/* ── HEADER ADMIN ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Système opérationnel</span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight">
            Console d'<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Administration</span>
          </h1>
          <p className="text-muted text-sm mt-1">
            Bienvenue, <span className="text-white font-semibold">{user?.prenom} {user?.nom}</span> — Supervision globale de la plateforme ScholarsNet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface/60 border border-border rounded-xl px-4 py-3 flex items-center gap-3 font-mono text-sm">
            <Clock size={16} className="text-primary" />
            <div>
              <div className="text-white font-bold">{now.toLocaleTimeString('fr-FR')}</div>
              <div className="text-muted text-xs">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
          <Link to="/admin" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25">
            <Settings size={16} /> Paramètres
          </Link>
        </div>
      </motion.div>

      {/* ── STATUS BAR ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'API Backend', status: 'Opérationnel', color: 'emerald', icon: Server },
          { label: 'Base MongoDB', status: 'Connectée', color: 'emerald', icon: Database },
          { label: 'Administrateurs', status: `${admins.length} compte(s)`, color: 'blue', icon: ShieldCheck },
          { label: 'Alertes actives', status: `${suspendedResearchers.length} suspension(s)`, color: suspendedResearchers.length > 0 ? 'amber' : 'emerald', icon: AlertTriangle },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + i * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl border bg-surface/30 border-${s.color}-500/20`}>
            <div className={`p-2 rounded-lg bg-${s.color}-500/10`}>
              <s.icon size={16} className={`text-${s.color}-400`} />
            </div>
            <div>
              <div className="text-white text-xs font-bold">{s.label}</div>
              <div className={`text-${s.color}-400 text-[11px] font-semibold`}>{s.status}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className={`relative overflow-hidden bg-gradient-to-br ${card.gradient} border ${card.border} rounded-2xl p-6 shadow-lg`}
          >
            <div className={`absolute -right-5 -bottom-5 opacity-[0.07]`}>
              <card.icon size={120} />
            </div>
            <div className="flex justify-between items-start mb-5">
              <div className={`p-2.5 rounded-xl ${card.iconBg} border border-white/5`}>
                <card.icon size={20} className={card.iconColor} />
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {card.trend}
              </span>
            </div>
            <div>
              <div className="text-4xl font-black text-white tracking-tight mb-1">{card.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</div>
              <div className="text-xs text-muted/70 mt-2">{card.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Évolution publications - grande */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel p-6 h-[360px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Évolution des Publications</h3>
              <p className="text-muted text-xs mt-0.5">Volume annuel par type de document</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg font-semibold">
              <Activity size={12} /> En direct
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={statsAnnee.evolution} margin={{ top: 5, right: 5, bottom: 20, left: -10 }}>
              <defs>
                <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="Article" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Conférence" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Autre" stackId="a" fill="#ec4899" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="total" name="Volume Total" stroke="#10b981" strokeWidth={2.5}
                dot={{ r: 3, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Répartition en pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-panel p-6 h-[360px]">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Répartition Documentaire</h3>
            <p className="text-muted text-xs mt-0.5">Distribution par type</p>
          </div>
          <ResponsiveContainer width="100%" height="75%">
            <PieChart>
              <Pie data={statsAnnee.pie} cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                dataKey="value" paddingAngle={3}>
                {statsAnnee.pie.map((entry, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 justify-center">
            {statsAnnee.pie.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                {item.name}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── ACTIVITÉ + UTILISATEURS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Dernières activités */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="glass-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Journal d'Activité</h3>
              <p className="text-muted text-xs mt-0.5">Dernières actions de la plateforme</p>
            </div>
            <Link to="/admin" state={{ tab: 'activite' }} className="text-xs text-primary hover:underline flex items-center gap-1">
              Tout voir <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="text-center text-muted text-sm italic py-8">Aucune activité enregistrée.</div>
            ) : notifications.map((notif, i) => {
              const typeColors = {
                connexion: 'bg-emerald-500/10 text-emerald-400',
                deconnexion: 'bg-slate-500/10 text-slate-400',
                nouvelle_publication: 'bg-blue-500/10 text-blue-400',
                mise_a_jour: 'bg-amber-500/10 text-amber-400',
                nouveau_chercheur: 'bg-violet-500/10 text-violet-400',
              };
              const colorClass = typeColors[notif.type] || 'bg-purple-500/10 text-purple-400';
              return (
                <motion.div key={notif._id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-surface/40 border border-border/40 hover:border-primary/30 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${colorClass} shrink-0`}>
                    <Activity size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-relaxed truncate">{notif.texte}</p>
                    <span className="text-[10px] text-muted font-mono">{new Date(notif.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  {!notif.lu && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Aperçu des utilisateurs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-panel p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Annuaire Utilisateurs</h3>
              <p className="text-muted text-xs mt-0.5">Vue d'ensemble des comptes</p>
            </div>
            <Link to="/admin" className="text-xs text-primary hover:underline flex items-center gap-1">
              Gérer <ChevronRight size={12} />
            </Link>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Total', value: chercheurs.length, color: 'text-white', bg: 'bg-surface/60 border border-border' },
              { label: 'Actifs', value: activeResearchers.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border border-emerald-500/20' },
              { label: 'Suspendus', value: suspendedResearchers.length, color: 'text-red-400', bg: 'bg-red-500/10 border border-red-500/20' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} rounded-xl p-3 text-center`}>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Liste derniers chercheurs */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {researchers.slice(0, 5).map((c, i) => (
              <motion.div key={c.uid} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(c.prenom?.[0] || '') + (c.nom?.[0] || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-semibold truncate">{c.prenom} {c.nom}</div>
                  <div className="text-xs text-muted truncate">{c.grade} · {c.laboratoire}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.actif !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {c.actif !== false ? 'Actif' : 'Suspendu'}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── ACTIONS RAPIDES ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="glass-panel p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-5">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Ajouter un utilisateur', icon: UserPlus, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', to: '/admin' },
            { label: 'Paramètres système', icon: Settings, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', to: '/admin' },
            { label: 'Importer des données', icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', to: '/admin' },
            { label: 'Journal d\'activité', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', to: '/admin' },
          ].map((action, i) => (
            <Link key={i} to={action.to}
              className={`group flex flex-col items-center gap-3 p-5 rounded-xl border ${action.bg} hover:scale-105 transition-all duration-200 text-center`}>
              <div className={`p-3 rounded-xl ${action.bg}`}>
                <action.icon size={22} className={action.color} />
              </div>
              <span className="text-sm font-semibold text-white group-hover:text-white/90">{action.label}</span>
            </Link>
          ))}
        </div>
      </motion.div>

    </div>
  );
}
