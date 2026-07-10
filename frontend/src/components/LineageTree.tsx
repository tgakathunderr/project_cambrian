import React, { useState, useEffect } from 'react';

interface GenealogyNode {
  id: string;
  name: string;
  parent1_id: string | null;
  parent1_name: string | null;
  parent2_id: string | null;
  parent2_name: string | null;
  generation: number;
  traits: {
    speed: number;
    metabolism: number;
    vision_range: number;
    size: number;
  };
  mutations: string[];
}

interface LineageTreeProps {
  onNodeClick?: (id: string) => void;
}

export const LineageTree: React.FC<LineageTreeProps> = ({ onNodeClick }) => {
  const [nodes, setNodes] = useState<GenealogyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<GenealogyNode | null>(null);
  const [loading, setLoading] = useState(true);

  // Pan offsets for tree dragging
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fetchLineage = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/lineage');
      const data = await res.json();
      setNodes(data);
    } catch (err) {
      console.error("Failed to load lineage data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineage();
    // Auto-refresh tree details every 6 seconds
    const interval = setInterval(fetchLineage, 6000);
    return () => clearInterval(interval);
  }, []);

  // Mouse drag panning logic for tree canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffsetX(prev => prev + dx);
    setOffsetY(prev => prev + dy);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Group nodes by generation to calculate structural layouts
  const generationsMap: Record<number, GenealogyNode[]> = {};
  nodes.forEach(n => {
    if (!generationsMap[n.generation]) {
      generationsMap[n.generation] = [];
    }
    generationsMap[n.generation].push(n);
  });

  const gens = Object.keys(generationsMap)
    .map(Number)
    .sort((a, b) => a - b);

  // Compute fixed layout coordinates for node positions
  const nodePositions: Record<string, { x: number; y: number }> = {};
  const colWidth = 260;
  const rowHeight = 90;

  gens.forEach((gen, gIdx) => {
    const list = generationsMap[gen];
    const colX = gIdx * colWidth + 120;
    list.forEach((node, nIdx) => {
      // Offset vertical coordinates to keep columns centered relative to each other
      const startY = (500 - (list.length * rowHeight) / 2) + nIdx * rowHeight;
      nodePositions[node.id] = { x: colX, y: startY };
    });
  });

  return (
    <div className="relative w-full h-full flex flex-col z-10">
      {/* Top Header */}
      <header className="flex justify-between items-center px-5 pt-5 pb-3 border-b border-white/5">
        <div>
          <h2 className="font-headline text-base font-bold text-[#dec2a0]">Ancestral Lineage Tree</h2>
          <p className="font-body text-[10px] text-white/30 mt-0.5">
            {nodes.length} specimens recorded · Drag to pan, click a node to inspect
          </p>
        </div>
        <span className="text-[9px] font-body text-white/20 uppercase tracking-[0.15em]">
          {loading ? 'Loading...' : `${Object.keys(generationsMap).length} generations`}
        </span>
      </header>

      {/* Main Drag Container */}
      <div 
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 w-full glass-panel border border-outline-variant/10 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing relative bg-background/20"
      >
        <div className="absolute inset-0 grid-overlay opacity-30"></div>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-outline">
            Loading lineages...
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-outline">
            <span className="material-symbols-outlined text-4xl text-outline/30 mb-2">
              insights
            </span>
            <p className="font-body text-sm">No ancestral lineages recorded yet.</p>
            <p className="font-body text-xs mt-1">Let organisms grow mature and mate to spawn generations.</p>
          </div>
        ) : (
          <div 
            className="absolute inset-0 transition-transform duration-75"
            style={{ transform: `translate(${offsetX}px, ${offsetY}px)` }}
          >
            {/* SVG Link overlay */}
            <svg className="absolute inset-0 w-[4000px] h-[3000px] pointer-events-none">
              <defs>
                <filter id="lineage-glow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {nodes.map(n => {
                const childPos = nodePositions[n.id];
                if (!childPos) return null;

                const links = [];
                // Link Parent 1
                if (n.parent1_id && nodePositions[n.parent1_id]) {
                  const pPos = nodePositions[n.parent1_id];
                  const midX = (pPos.x + childPos.x) / 2;
                  const d = `M ${pPos.x} ${pPos.y} C ${midX} ${pPos.y}, ${midX} ${childPos.y}, ${childPos.x} ${childPos.y}`;
                  links.push(
                    <path
                      key={`${n.id}-p1`}
                      d={d}
                      fill="none"
                      stroke="rgba(141, 168, 155, 0.18)" // Sage connection line
                      strokeWidth="1.5"
                      className="connection-path"
                      filter="url(#lineage-glow)"
                    />
                  );
                }
                // Link Parent 2
                if (n.parent2_id && nodePositions[n.parent2_id]) {
                  const pPos = nodePositions[n.parent2_id];
                  const midX = (pPos.x + childPos.x) / 2;
                  const d = `M ${pPos.x} ${pPos.y} C ${midX} ${pPos.y}, ${midX} ${childPos.y}, ${childPos.x} ${childPos.y}`;
                  links.push(
                    <path
                      key={`${n.id}-p2`}
                      d={d}
                      fill="none"
                      stroke="rgba(192, 198, 222, 0.18)" // Lavender connection line
                      strokeWidth="1.5"
                      className="connection-path"
                      filter="url(#lineage-glow)"
                    />
                  );
                }
                return links;
              })}
            </svg>

            {/* Nodes Layout Layer */}
            {nodes.map(n => {
              const pos = nodePositions[n.id];
              if (!pos) return null;

              const isSelected = selectedNode?.id === n.id;

              return (
                <div
                  key={n.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(isSelected ? null : n);
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center p-2.5 rounded-2xl transition-all duration-300 border cursor-pointer ${
                    isSelected 
                      ? 'border-[#dec2a0]/30 bg-[#dec2a0]/8 shadow-[0_0_20px_rgba(222,194,160,0.12)]' 
                      : 'border-white/6 bg-white/3 hover:border-white/15 hover:bg-white/5'
                  }`}
                  style={{ left: pos.x, top: pos.y }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-headline text-[10px] font-bold ${
                    n.generation === 1 
                      ? 'border-[#8da89b]/30 bg-[#8da89b]/10 text-[#8da89b]' 
                      : 'border-[#dec2a0]/25 bg-[#dec2a0]/8 text-[#dec2a0]'
                  }`}>
                    G{n.generation}
                  </div>
                  <span className="mt-1.5 font-headline text-[11px] font-semibold text-white/70 truncate max-w-[90px] text-center">
                    {n.name}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Node Quick Panel */}
        {selectedNode && (
          <div className="absolute right-4 top-4 w-64 glass-overlay border border-white/8 p-4 rounded-2xl animate-slide-in-up z-30">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-headline text-base font-bold text-[#dec2a0] leading-tight">
                  {selectedNode.name}
                </h4>
                <p className="font-body text-[9px] text-white/30 mt-0.5 uppercase tracking-wider">
                  Generation {selectedNode.generation}
                </p>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="w-6 h-6 rounded-lg bg-white/4 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-3">
              {selectedNode.generation > 1 && (
                <div className="space-y-1 text-[10px] font-body">
                  {selectedNode.parent1_name && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/25">Parent A:</span>
                      <span className="text-white/60 font-semibold">{selectedNode.parent1_name}</span>
                    </div>
                  )}
                  {selectedNode.parent2_name && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-white/25">Parent B:</span>
                      <span className="text-white/60 font-semibold">{selectedNode.parent2_name}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedNode.mutations && selectedNode.mutations.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedNode.mutations.slice(0, 3).map((m, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded-full bg-[#8da89b]/10 border border-[#8da89b]/20 text-[8px] font-body text-[#8da89b]/70">
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* Biography button */}
              {onNodeClick && (
                <button
                  onClick={() => { onNodeClick(selectedNode.id); setSelectedNode(null); }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#dec2a0]/10 border border-[#dec2a0]/20 text-[#dec2a0]/70 text-[11px] font-headline font-semibold hover:bg-[#dec2a0]/18 hover:text-[#dec2a0] transition-all"
                >
                  <span className="material-symbols-outlined text-sm">menu_book</span>
                  View Full Biography
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
