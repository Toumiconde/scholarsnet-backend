import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Network, BarChart, BookOpen, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Moteur de Recherche',
      description: 'Explorez plus de 1000 publications scientifiques avec des filtres avancés.',
      icon: Search,
      path: '/search',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      title: 'Réseau de Co-auteurs',
      description: 'Visualisez les collaborations entre chercheurs de l\'UGANC sous forme de graphe interactif.',
      icon: Network,
      path: '/network',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Statistiques Labo',
      description: 'Analysez la production scientifique par laboratoire, par année et par type.',
      icon: BarChart,
      path: '/stats/LARI',
      color: 'from-orange-500 to-amber-400'
    },
    {
      title: 'Profils Chercheurs',
      description: 'Gérez votre profil académique, vos publications et calculez votre h-index.',
      icon: BookOpen,
      path: '/profile/CHR001', // Demo profile
      color: 'from-emerald-500 to-teal-400'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
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
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link to={feature.path} className="block group h-full">
                <div className="glass-card p-8 h-full flex flex-col relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                  
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-[1px] mb-6 shadow-lg`}>
                    <div className="w-full h-full rounded-xl bg-surface flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted flex-1">
                    {feature.description}
                  </p>
                  
                  <div className="mt-6 flex items-center gap-2 text-primary font-medium opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    Explorer <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  );
}
