import { Link, Outlet, useLocation } from 'react-router-dom';
import { Search, Home, User, Share2, BarChart2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Accueil', icon: Home },
    { path: '/search', label: 'Recherche', icon: Search },
    { path: '/network', label: 'Réseau', icon: Share2 },
    { path: '/stats/LARI', label: 'Statistiques Labo', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Glassmorphism Navbar */}
      <nav className="fixed w-full z-50 glass-panel border-b-0 rounded-none bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-white font-bold text-xl leading-none tracking-tighter">S</span>
              </div>
              <span className="font-bold text-xl tracking-tight text-white">Scholars<span className="text-primary">Net</span></span>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? 'text-white' : 'text-muted hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 z-10 relative">
                        <Icon size={18} className={isActive ? 'text-primary' : ''} />
                        {item.label}
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className="absolute inset-0 bg-white/10 rounded-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center">
              {/* Fake Auth Avatar for demo */}
              <Link to="/profile/CHR001" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-white">Prof. Condé</div>
                  <div className="text-xs text-primary">LARI - UGANC</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-secondary to-primary p-[2px]">
                  <div className="w-full h-full rounded-full bg-surface flex items-center justify-center border-2 border-surface overflow-hidden">
                    <User size={20} className="text-muted" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative">
        {/* Background ambient glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
        
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
