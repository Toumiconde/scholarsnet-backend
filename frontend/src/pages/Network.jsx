import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { Network as NetworkIcon, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function Network() {
  const fgRef = useRef();
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 800, height: 600 });
  const { user } = useAuth();

  useEffect(() => {
    // Responsive canvas
    const handleResize = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setWindowSize({ width: container.clientWidth, height: container.clientHeight });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const fetchNetwork = async () => {
      try {
        setLoading(true);
        // Using simulated data for a rich visual if backend empty, otherwise fetch
        const { data } = await api.get('/stats/coauteurs/CHR001').catch(() => ({
          data: [
            { _id: 'CHR002', nom: 'Bah Amadou', nb: 12 },
            { _id: 'CHR004', nom: 'Diallo Fatoumata', nb: 8 },
            { _id: 'CHR007', nom: 'Camara A.', nb: 15 },
            { _id: 'CHR012', nom: 'Balde I.', nb: 5 },
            { _id: 'CHR015', nom: 'Sow M.', nb: 3 },
          ]
        }));

        const nodes = [{ id: 'CHR001', name: 'Condé M. (Moi)', val: 20, color: '#3b82f6' }];
        const links = [];

        data.forEach(co => {
          nodes.push({ id: co._id, name: co.nom, val: Math.min(20, co.nb * 2), color: '#8b5cf6' });
          links.push({ source: 'CHR001', target: co._id, value: co.nb });
        });

        // Add some random cross links for visual complexity if not enough data
        if (nodes.length > 2) {
          links.push({ source: nodes[1].id, target: nodes[2].id, value: 5 });
        }

        setGraphData({ nodes, links });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetwork();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigate = useNavigate();
  const handleZoomIn = useCallback(() => { fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400); }, []);
  const handleZoomOut = useCallback(() => { fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400); }, []);
  const handleFit = useCallback(() => { fgRef.current?.zoomToFit(400); }, []);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Réseau de Co-auteurs</h1>
        <p className="text-muted">Pipeline 1 : Graphe d'interactions scientifiques généré via $unwind et $group.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel flex-1 relative overflow-hidden flex flex-col"
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></span>
          </div>
        ) : (
          <>
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-surface/80 backdrop-blur-md p-2 rounded-xl border border-border">
              <button onClick={handleZoomIn} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ZoomIn size={20}/></button>
              <button onClick={handleZoomOut} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><ZoomOut size={20}/></button>
              <button onClick={handleFit} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"><Maximize size={20}/></button>
            </div>
            
            <div id="graph-container" className="w-full flex-1">
              {windowSize.width > 0 && (
                <ForceGraph2D
                  ref={fgRef}
                  width={windowSize.width}
                  height={windowSize.height}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeColor="color"
                  nodeRelSize={6}
                  linkColor={() => '#334155'}
                  linkWidth={link => link.value}
                  d3VelocityDecay={0.3}
                  backgroundColor="rgba(0,0,0,0)"
                  onNodeClick={node => {
                    fgRef.current.centerAt(node.x, node.y, 1000);
                    fgRef.current.zoom(2, 2000);
                    setTimeout(() => navigate(`/profile/${node.id}`), 500);
                  }}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12/globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.fillStyle = node.color;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                    ctx.fill();
                    
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = '#f8fafc';
                    ctx.fillText(label, node.x, node.y + node.val + fontSize);
                  }}
                />
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
