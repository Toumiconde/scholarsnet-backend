import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter, BookOpen, User, Calendar, Tag } from 'lucide-react';
import api from '../lib/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [annee, setAnnee] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (type) params.append('type', type);
      if (annee) params.append('annee', annee);
      
      const { data } = await api.get(`/publications?${params.toString()}`);
      setResults(data.publications || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      // Fallback for demo if backend is not running
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Run empty search on mount to show some data
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Moteur de Recherche</h1>
          <p className="text-muted">Trouvez des publications scientifiques avec $regex et filtres combinés.</p>
        </div>
        <div className="text-sm font-medium px-4 py-2 rounded-lg bg-surface border border-border">
          <span className="text-primary">{total}</span> résultats
        </div>
      </div>

      <div className="glass-panel p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par titre, mots-clés ($regex)..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full md:w-48 relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">Tous les types</option>
              <option value="article">Article</option>
              <option value="inproceedings">Conférence</option>
              <option value="thesis">Thèse</option>
              <option value="book">Livre</option>
              <option value="report">Rapport</option>
            </select>
          </div>
          <div className="w-full md:w-32 relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="number" 
              placeholder="Année" 
              value={annee}
              onChange={(e) => setAnnee(e.target.value)}
              className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button 
            type="submit"
            className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : 'Rechercher'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {results.length > 0 ? (
          results.map((pub, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={pub.pid || idx} 
              className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0">
                <BookOpen className={pub.type === 'article' ? 'text-blue-400' : pub.type === 'thesis' ? 'text-purple-400' : 'text-emerald-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface text-muted uppercase tracking-wider">
                    {pub.type}
                  </span>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {pub.annee}
                  </span>
                  <span className="text-xs text-muted">ID: {pub.pid}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 leading-tight">{pub.titre}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {pub.auteurs?.map((auteur, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-sm text-secondary bg-secondary/10 px-2 py-1 rounded-md">
                      <User size={14} /> {auteur.nom}
                    </span>
                  ))}
                </div>
                {pub.mots_cles && pub.mots_cles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                    {pub.mots_cles.map(kw => (
                      <span key={kw} className="text-xs text-muted hover:text-white cursor-pointer transition-colors">#{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          !loading && (
            <div className="text-center py-20 glass-panel">
              <SearchIcon size={48} className="mx-auto text-border mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Aucun résultat</h3>
              <p className="text-muted">Modifiez vos critères de recherche pour trouver des publications.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
