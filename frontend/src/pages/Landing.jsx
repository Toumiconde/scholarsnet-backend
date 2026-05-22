import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Database, Share2, Search, ArrowRight, UserCheck, BookOpen, Globe, TrendingUp, Users, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

export default function Landing() {
  const handleLeaveSite = () => {
    // Tentative de fermeture de l'onglet (fonctionne si l'onglet a été ouvert par un script)
    window.close();
    // Fallback : Redirection vers une page neutre si la fermeture est bloquée par le navigateur
    window.location.href = "https://www.google.com";
  };

  return (
    <div className="min-h-screen">
      {/* 1. Hero Section avec Image de fond */}
      <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80" 
            alt="Recherche scientifique" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-background"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <BookOpen size={16} /> Université Gamal Abdel Nasser de Conakry
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-tight">
              L'Avenir de la <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Recherche Guinéenne</span>
            </h1>
            
            <p className="text-xl text-muted leading-relaxed">
              ScholarsNet est le premier réseau social académique dédié à la valorisation, au partage et à l'analyse des publications scientifiques. Rejoignez une communauté d'excellence.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 pt-4">
              <Link to="/login" className="px-8 py-4 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 text-lg">
                Espace Chercheur <ArrowRight size={20} />
              </Link>
              <Link to="/dashboard" className="px-8 py-4 rounded-xl bg-surface/50 backdrop-blur-sm border border-border text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-lg">
                <Globe size={20} /> Visiter publiquement
              </Link>
              <button onClick={handleLeaveSite} className="px-8 py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 text-lg">
                <XCircle size={20} /> Quitter le site
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" 
              alt="Étudiants et chercheurs" 
              className="rounded-3xl border border-white/10 shadow-2xl relative z-10"
            />
            
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 glass-panel p-4 rounded-2xl flex items-center gap-4 z-20 shadow-xl border border-white/20">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <TrendingUp className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-bold">+500 Publications</p>
                <p className="text-xs text-muted">Indexées et analysées</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Pourquoi utiliser ScholarsNet (Public Cible) */}
      <section className="py-24 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">Pourquoi nous rejoindre ?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Pour les chercheurs */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass-panel p-10 text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 group-hover:bg-primary/20 transition-colors"></div>
              <UserCheck size={40} className="text-primary mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Pour les Chercheurs</h3>
              <ul className="space-y-4 text-muted">
                <li className="flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-1" size={18} /> <strong>Visibilité mondiale :</strong> Publiez vos travaux et augmentez votre portée.</li>
                <li className="flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-1" size={18} /> <strong>Calcul du H-Index :</strong> Suivez l'impact réel de vos publications de façon automatisée.</li>
                <li className="flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-1" size={18} /> <strong>Réseau :</strong> Trouvez de nouveaux collaborateurs et co-auteurs au sein de l'université.</li>
              </ul>
            </motion.div>

            {/* Pour les visiteurs */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="glass-panel p-10 text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full -z-10 group-hover:bg-secondary/20 transition-colors"></div>
              <Users size={40} className="text-secondary mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Pour les Visiteurs & Étudiants</h3>
              <ul className="space-y-4 text-muted">
                <li className="flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-1" size={18} /> <strong>Accès Libre :</strong> Lisez, explorez et téléchargez les thèses et articles de recherche.</li>
                <li className="flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-1" size={18} /> <strong>Moteur Intelligent :</strong> Trouvez instantanément ce que vous cherchez via notre moteur NoSQL multicritères.</li>
                <li className="flex items-start gap-3"><CheckCircle className="text-emerald-400 shrink-0 mt-1" size={18} /> <strong>Statistiques des labos :</strong> Observez l'évolution scientifique des différents laboratoires.</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Fonctionnalités avec Images alternées */}
      <section className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
          
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Share2 size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white">Un réseau de co-auteurs interactif</h3>
              <p className="text-lg text-muted">
                Plongez dans les données grâce à une cartographie visuelle unique. Notre système génère un graphe physique dynamique permettant de comprendre en un clin d'œil qui travaille avec qui. Cliquez sur un nœud pour découvrir le profil complet d'un chercheur.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80" alt="Réseau interactif" className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="w-full md:w-1/2 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Database size={32} />
              </div>
              <h3 className="text-3xl font-bold text-white">Technologie de pointe MongoDB</h3>
              <p className="text-lg text-muted">
                ScholarsNet n'est pas qu'une simple application. C'est une vitrine technologique prouvant la supériorité des bases de données NoSQL (MongoDB) pour la gestion académique : pipelines d'agrégation massifs, polymorphisme des publications, et performances inégalées face au SQL classique.
              </p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80" alt="Analyses et bases de données" className="w-full h-[300px] object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-60"></div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Footer CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/10"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 space-y-8">
          <ShieldCheck size={64} className="mx-auto text-primary" />
          <h2 className="text-4xl md:text-5xl font-bold text-white">Prêt à intégrer la communauté ?</h2>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Que vous soyez chercheur souhaitant valoriser vos travaux ou visiteur en quête de savoir, ScholarsNet est votre portail d'entrée.
          </p>
          <div className="pt-8 flex justify-center">
            <Link to="/login" className="px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              Accéder à la plateforme
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
