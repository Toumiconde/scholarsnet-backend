import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, ComposedChart, Line, RadialBarChart, RadialBar, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, Book, Users, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function LabStats() {
  const { labo } = useParams();
  const { user } = useAuth();
  const [statsAnnee, setStatsAnnee] = useState([]);
  const [topAuteurs, setTopAuteurs] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [kpis, setKpis] = useState({ publicationsTotales: 0, chercheursActifs: 0, citations: 0, croissance: '0%' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Call backend endpoints (simulated if down)
        const [resAnnee, resAuteurs, resKeywords, resKpis] = await Promise.all([
          api.get(`/stats/labo/${labo}`).catch(() => ({ data: [
            { _id: { annee: 2023, type: 'article' }, count: 12 },
            { _id: { annee: 2023, type: 'inproceedings' }, count: 8 },
            { _id: { annee: 2022, type: 'article' }, count: 15 },
          ]})),
          api.get(`/stats/top-auteurs`).catch(() => ({ data: [
            { nom: 'Condé M.', nb_pubs: 24 }, { nom: 'Diallo F.', nb_pubs: 18 }
          ]})),
          api.get(`/stats/keywords/${labo}`).catch(() => ({ data: [
            { _id: 'NLP', count: 15 }, { _id: 'IA', count: 12 }, { _id: 'Big Data', count: 9 }
          ]})),
          api.get(`/stats/kpis/${labo}`).catch(() => ({ data: {
            publicationsTotales: 0, chercheursActifs: 0, citations: 0, croissance: '0%'
          }}))
        ]);

        // Process data for charts
        const evolution = {};
        const typesCount = {};
        
        resAnnee.data.forEach(item => {
          const year = item._id.annee;
          const type = item._id.type;
          
          if (!evolution[year]) evolution[year] = { name: year.toString(), total: 0, Article: 0, Conférence: 0, Autre: 0 };
          evolution[year].total += item.count;
          
          if (type.toLowerCase() === 'article') evolution[year].Article += item.count;
          else if (type.toLowerCase() === 'inproceedings') evolution[year].Conférence += item.count;
          else evolution[year].Autre += item.count;

          typesCount[type] = (typesCount[type] || 0) + item.count;
        });

        const sortedEvol = Object.values(evolution).sort((a, b) => parseInt(a.name) - parseInt(b.name));
        const pieData = Object.keys(typesCount).map((k, i) => ({ name: k.toUpperCase(), value: typesCount[k], fill: COLORS[i % COLORS.length] }));

        setStatsAnnee({ evolution: sortedEvol, pie: pieData });
        setTopAuteurs(resAuteurs.data.slice(0, 5));
        setKeywords(resKeywords.data.slice(0, 10));
        setKpis(resKpis.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [labo]);

  if (loading) return <div className="flex justify-center items-center h-64"><span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span></div>;
  const renderVisitorDashboard = () => (
    <div className="space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-3">
          Découvrez l'impact du Laboratoire {labo}
        </h1>
        <p className="text-muted text-lg max-w-2xl">
          Explorez nos avancées scientifiques, rencontrez nos chercheurs et plongez au cœur de nos domaines d'expertise. Une vue simplifiée pour comprendre notre contribution à la science.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Publications Totales', value: kpis.publicationsTotales, icon: Book, color: 'text-blue-500' },
          { label: 'Chercheurs Actifs', value: kpis.chercheursActifs, icon: Users, color: 'text-purple-500' },
          { label: 'Citations', value: kpis.citations, icon: Award, color: 'text-pink-500' },
          { label: 'Croissance', value: kpis.croissance, icon: Activity, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-surface ${stat.color} bg-opacity-10`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted">{stat.label}</p>
                <h4 className="text-2xl font-bold text-white">{stat.value}</h4>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Le nombre de nos publications par année</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsAnnee.evolution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="glass-panel p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Nos différents types de documents</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsAnnee.pie} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Nos chercheurs les plus actifs</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topAuteurs} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="nom" type="category" stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
              <Bar dataKey="nb_pubs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-panel p-6">
          <h3 className="text-lg font-bold text-white mb-6">Nos principaux domaines d'expertise</h3>
          <div className="flex flex-wrap gap-3">
            {keywords.map((kw, i) => (
              <div key={kw._id} className="px-4 py-2 rounded-full bg-surface border border-border text-sm flex items-center gap-2">
                <span className="text-white font-medium">{kw._id}</span>
                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-md text-xs">{kw.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderProDashboard = () => (
    <div className="space-y-8">
      <div className="mb-8 border-l-4 border-primary pl-4">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          Tableau de Bord Scientifique : {labo}
        </h1>
        <p className="text-muted text-sm font-mono uppercase tracking-widest">
          Métriques Analytiques & Pipelines d'Agrégation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Volume Global (Pubs)', value: kpis.publicationsTotales, sub: '+12% ce mois', trend: 'up', icon: Book, bg: 'from-blue-600/10 to-blue-900/5', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
          { label: 'Ressources (Chercheurs)', value: kpis.chercheursActifs, sub: 'Effectif stable', trend: 'neutral', icon: Users, bg: 'from-purple-600/10 to-purple-900/5', border: 'border-purple-500/20', iconColor: 'text-purple-400' },
          { label: 'Impact (Citations)', value: kpis.citations, sub: '+84 nouvelles', trend: 'up', icon: Award, bg: 'from-pink-600/10 to-pink-900/5', border: 'border-pink-500/20', iconColor: 'text-pink-400' },
          { label: 'Indice Croissance', value: kpis.croissance, sub: 'Au-dessus de la cible', trend: 'up', icon: Activity, bg: 'from-emerald-600/10 to-emerald-900/5', border: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-2xl p-6 backdrop-blur-xl shadow-lg`}
          >
            {/* Watermark Icon */}
            <div className={`absolute -right-4 -bottom-4 opacity-10 ${stat.iconColor}`}>
               <stat.icon size={110} />
            </div>
            
            <div className="relative z-10 flex justify-between items-start mb-4">
               <div className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 shadow-inner">
                 <stat.icon size={20} className={stat.iconColor} />
               </div>
            </div>
            
            <div className="relative z-10">
               <h4 className="text-4xl font-black text-white mb-1.5 tracking-tight">{stat.value}</h4>
               <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{stat.label}</p>
               
               <div className="flex items-center gap-1.5 text-xs font-medium bg-slate-900/40 w-fit px-2.5 py-1 rounded-full border border-white/5">
                  {stat.trend === 'up' && <TrendingUp size={14} className="text-emerald-400" />}
                  {stat.trend === 'down' && <TrendingDown size={14} className="text-rose-400" />}
                  {stat.trend === 'neutral' && <Minus size={14} className="text-slate-400" />}
                  <span className={stat.trend === 'up' ? 'text-emerald-400' : stat.trend === 'down' ? 'text-rose-400' : 'text-slate-400'}>
                    {stat.sub}
                  </span>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ÉVOLUTION LONGITUDINALE - 2 COLONNES */}
        <motion.div className="glass-panel p-6 lg:col-span-2 h-[450px]">
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6">Évolution Longitudinale & Typologique</h3>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={statsAnnee.evolution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="Article" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
              <Bar dataKey="Conférence" stackId="a" fill="#8b5cf6" />
              <Bar dataKey="Autre" stackId="a" fill="#ec4899" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="total" name="Volume Total" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#0f172a' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* RÉPARTITION TAXONOMIQUE */}
        <motion.div className="glass-panel p-6 h-[400px]">
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">Répartition Taxonomique</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={15} data={statsAnnee.pie}>
              <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} background clockWise dataKey="value" />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#94a3b8', fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* DISTRIBUTION SÉMANTIQUE (RADAR) */}
        <motion.div className="glass-panel p-6 h-[400px]">
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-2">Cartographie Sémantique</h3>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="65%" data={keywords.slice(0, 6)}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="_id" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Occurrences" dataKey="count" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* MATRICE DES CONTRIBUTEURS */}
        <motion.div className="glass-panel p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-sm font-bold text-muted uppercase tracking-widest mb-6">Matrice de Performance des Contributeurs</h3>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-700 text-xs uppercase text-muted tracking-wider">
                  <th className="pb-3 font-semibold pl-2">Rang</th>
                  <th className="pb-3 font-semibold">Chercheur</th>
                  <th className="pb-3 font-semibold text-right">Volume de Pubs</th>
                  <th className="pb-3 font-semibold text-right pr-2">Impact Relatif</th>
                </tr>
              </thead>
              <tbody>
                {topAuteurs.map((auteur, index) => {
                  const maxPubs = topAuteurs.length > 0 ? topAuteurs[0].nb_pubs : 1;
                  const pct = Math.round((auteur.nb_pubs / maxPubs) * 100);
                  return (
                    <tr key={index} className="border-b border-slate-800 hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-2 text-sm font-black text-primary">#{index + 1}</td>
                      <td className="py-4 text-sm font-bold text-gray-200">{auteur.nom}</td>
                      <td className="py-4 text-sm text-right font-mono text-muted">{auteur.nb_pubs}</td>
                      <td className="py-4 pr-2">
                        <div className="flex items-center justify-end gap-3">
                           <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                               className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                             />
                           </div>
                           <span className="text-xs text-muted w-8 text-right font-mono">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <div className="mb-8 border-l-4 border-amber-500 pl-4">
        <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
          Supervision du Laboratoire : {labo}
        </h1>
        <p className="text-muted text-sm font-mono uppercase tracking-widest text-amber-400/80">
          Console d'Administration & Audit des Données
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'Volume de Données (Pubs)', value: kpis.publicationsTotales, sub: 'Indexées', icon: Book, bg: 'from-slate-800 to-slate-900', border: 'border-slate-700', iconColor: 'text-slate-400' },
          { label: 'Comptes Actifs (Chercheurs)', value: kpis.chercheursActifs, sub: 'Enregistrés', icon: Users, bg: 'from-indigo-900/40 to-slate-900', border: 'border-indigo-500/30', iconColor: 'text-indigo-400' },
          { label: 'Indicateur d\'Impact Global', value: kpis.citations, sub: 'Citations', icon: Award, bg: 'from-amber-900/40 to-slate-900', border: 'border-amber-500/30', iconColor: 'text-amber-400' },
          { label: 'Taux de Croissance', value: kpis.croissance, sub: 'Évolution annuelle', icon: Activity, bg: 'from-emerald-900/40 to-slate-900', border: 'border-emerald-500/30', iconColor: 'text-emerald-400' },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.bg} border ${stat.border} rounded-xl p-6 shadow-md`}
          >
            <div className="flex justify-between items-start mb-4">
               <div className={`p-2.5 rounded-lg bg-surface/50 border border-white/5`}>
                 <stat.icon size={20} className={stat.iconColor} />
               </div>
            </div>
            
            <div className="relative z-10">
               <h4 className="text-3xl font-bold text-white mb-1 tracking-tight">{stat.value}</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
               
               <div className="inline-block text-xs font-medium bg-black/20 px-2 py-1 rounded text-muted">
                  {stat.sub}
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ÉVOLUTION TEMPORELLE DES ENREGISTREMENTS */}
        <motion.div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 h-[350px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={14} className="text-amber-400"/> Télémétrie des insertions (Volume)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={statsAnnee.evolution} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* CLASSIFICATION DES TYPES DE DOCUMENTS */}
        <motion.div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 h-[350px]">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Book size={14} className="text-indigo-400"/> Audit de Classification Documentaire
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statsAnnee.pie} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false}/>
              <YAxis dataKey="name" type="category" stroke="#e2e8f0" tick={{fontSize: 11, fontWeight: 'bold'}} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#334155', opacity: 0.2 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* TOP COMPTES (Auteurs) */}
        <motion.div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users size={14} className="text-emerald-400"/> Comptes à Haute Contribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
             {topAuteurs.map((auteur, i) => (
                <div key={i} className="bg-black/20 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-emerald-500/30 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mb-3 text-emerald-400 font-bold text-sm border border-slate-700">
                     #{i + 1}
                   </div>
                   <span className="text-sm font-bold text-white mb-1 truncate w-full">{auteur.nom}</span>
                   <span className="text-xs text-muted bg-slate-800 px-2 py-0.5 rounded">{auteur.nb_pubs} pubs</span>
                </div>
             ))}
          </div>
        </motion.div>

      </div>
    </div>
  );

  if (user && user.role === 'chercheur') return renderProDashboard();
  if (user && user.role === 'admin') return renderAdminDashboard();
  return renderVisitorDashboard();
}
