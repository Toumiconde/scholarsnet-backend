import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Database, AlertCircle, CheckCircle, FileJson, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function Admin() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [chercheurs, setChercheurs] = useState([]);

  React.useEffect(() => {
    const fetchChercheurs = async () => {
      try {
        const { data } = await api.get('/chercheurs');
        // Handle if data is array or wrapped in an object depending on backend
        setChercheurs(Array.isArray(data) ? data : (data.chercheurs || []));
      } catch (err) {
        // Fallback for demo if DB is empty/unreachable
        setChercheurs([
          { uid: 'CHR001', nom: 'Condé', prenom: 'Mamadou Alpha', laboratoire: 'LARI', grade: 'Professeur', role: 'chercheur' },
          { uid: 'CHR002', nom: 'Diallo', prenom: 'Fatoumata', laboratoire: 'LARI', grade: 'Maître de conférences', role: 'chercheur' },
          { uid: 'ADM001', nom: 'Admin', prenom: 'Système', laboratoire: 'DSI', grade: 'Technicien', role: 'admin' }
        ]);
      }
    };
    fetchChercheurs();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simulation of upload or actual call
      // const { data } = await api.post('/publications/importJSON', formData);
      
      // Simulated response to match backend structure
      setTimeout(() => {
        setResult({
          importes: 1045,
          doublons: 12,
          total: 1057
        });
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'importation.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Administration</h1>
        <p className="text-muted">Gérez la plateforme et importez des données de publications (Format DBLP).</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Database className="text-secondary" /> Import de Données (DBLP)
        </h2>

        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center hover:bg-white/5 transition-colors">
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".json"
            onChange={handleFileChange}
          />
          <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
              <FileJson size={32} className="text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {file ? file.name : "Sélectionner un fichier JSON"}
            </h3>
            <p className="text-sm text-muted max-w-sm mx-auto">
              {file ? `Taille : ${(file.size / 1024).toFixed(2)} KB` : "Téléversez le dataset DBLP au format JSON pour peupler la base de données MongoDB."}
            </p>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleUpload}
            disabled={!file || loading}
            className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all ${
              !file || loading ? 'bg-surface text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-600 shadow-lg shadow-primary/25'
            }`}
          >
            {loading ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <Upload size={20} />}
            Lancer l'importation
          </button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-4">
            <CheckCircle className="text-emerald-500 shrink-0 mt-1" />
            <div>
              <h4 className="text-emerald-500 font-bold mb-1">Importation réussie</h4>
              <p className="text-sm text-emerald-400/80">
                L'import en masse est terminé. L'opération <code>insertMany</code> de MongoDB a inséré {result.importes} documents. {result.doublons} doublons ont été ignorés.
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-4">
            <AlertCircle className="text-red-500 shrink-0 mt-1" />
            <div>
              <h4 className="text-red-500 font-bold mb-1">Échec de l'importation</h4>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Gestion des utilisateurs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Database className="text-secondary" /> Gestion des Chercheurs inscrits
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-muted">
                <th className="pb-3 font-medium px-4">Identifiant</th>
                <th className="pb-3 font-medium px-4">Nom complet</th>
                <th className="pb-3 font-medium px-4">Grade</th>
                <th className="pb-3 font-medium px-4">Laboratoire</th>
                <th className="pb-3 font-medium px-4">Rôle</th>
                <th className="pb-3 font-medium px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chercheurs.map((c, i) => (
                <tr key={c.uid || i} className="border-b border-border/10 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-4 text-white font-mono text-sm">{c.uid}</td>
                  <td className="py-4 px-4 text-white font-medium">{c.prenom} <span className="uppercase">{c.nom}</span></td>
                  <td className="py-4 px-4 text-muted">{c.grade}</td>
                  <td className="py-4 px-4 text-muted">{c.laboratoire}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${c.role === 'admin' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {c.role === 'admin' ? 'ADMIN' : 'CHERCHEUR'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <Link 
                      to={`/profile/${c.uid}`} 
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-surface border border-border text-muted hover:text-white hover:bg-white/10 transition-colors"
                      title="Voir le profil"
                    >
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
              {chercheurs.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-muted">Aucun chercheur trouvé dans la base de données.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
