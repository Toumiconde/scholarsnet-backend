import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search as SearchIcon, Filter, BookOpen, User, Calendar, Tag } from 'lucide-react';
import api from '../lib/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [annee, setAnnee] = useState('');
  const [auteur, setAuteur] = useState('');
  const [page, setPage] = useState(1);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const handleSearch = async (e, newPage = 1) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (type) params.append('type', type);
      if (annee) params.append('annee', annee);
      if (auteur) params.append('auteur', auteur);
      params.append('page', newPage);
      
      const { data } = await api.get(`/publications?${params.toString()}`);
      setResults(data.publications || []);
      setTotal(data.total || 0);
      setPage(newPage);
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
          <div className="w-full md:w-48 relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Auteur" 
              value={auteur}
              onChange={(e) => setAuteur(e.target.value)}
              className="w-full bg-surface/50 border border-border rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
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
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="text-xs font-semibold px-2 py-1 rounded-md bg-surface text-muted uppercase tracking-wider">
                    {pub.type}
                  </span>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">
                    {pub.annee}
                  </span>
                  {pub.statut === 'brouillon' && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 uppercase tracking-wider">📝 Brouillon</span>}
                  {pub.statut === 'en_cours' && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">⚙️ En cours</span>}
                  {pub.statut === 'soumis' && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 uppercase tracking-wider">📤 Soumis</span>}
                  {pub.statut === 'revision' && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">🔄 Révision</span>}
                  {(pub.statut === 'publie' || !pub.statut) && <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">✅ Publié</span>}
                  <span className="text-xs text-muted">ID: {pub.pid}</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                  <Link to={`/publication/${pub.pid}`} className="hover:text-primary transition-colors">
                    {pub.titre}
                  </Link>
                </h3>
                {pub.statut === 'en_cours' && (
                  <p className="text-sm text-blue-400/80 italic mb-3 flex items-center gap-1.5 bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 w-fit">
                    <span>⚙️</span> "Cette recherche est en cours de rédaction"
                  </p>
                )}
                {pub.statut === 'revision' && (
                  <p className="text-sm text-orange-400/80 italic mb-3 flex items-center gap-1.5 bg-orange-500/5 px-3 py-1.5 rounded-lg border border-orange-500/10 w-fit">
                    <span>🔄</span> "Cette publication est en cours de révision"
                  </p>
                )}
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

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button 
            disabled={page === 1} 
            onClick={() => handleSearch(null, page - 1)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-white disabled:opacity-50 hover:bg-white/5 transition-colors"
          >
            Précédent
          </button>
          <span className="text-muted text-sm">Page {page}</span>
          <button 
            disabled={page * 20 >= total}
            onClick={() => handleSearch(null, page + 1)}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-white disabled:opacity-50 hover:bg-white/5 transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
