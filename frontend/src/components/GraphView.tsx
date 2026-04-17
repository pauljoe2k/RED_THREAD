'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Public types (exported for dashboard) ────────────────────────────────────

export interface GraphNode {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  createdBy: { _id: string; username: string };
  createdAt: string;
}

export interface GraphThread {
  _id: string;
  fromNode: { _id: string; title: string };
  toNode: { _id: string; title: string };
  type: string;
  description: string;
  createdBy: { _id: string; username: string };
}

// ─── D3 internal types ────────────────────────────────────────────────────────

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdBy: { _id: string; username: string };
  createdAt: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  linkId: string;
  type: string;
  description: string;
}

// ─── Side-panel data (React state — drives only the panel, never the SVG) ─────

interface PanelData {
  node: GraphNode;
  connectedNodes: { id: string; title: string; type: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THREAD_COLORS: Record<string, string> = {
  influence: '#d97706',
  similarity: '#3b82f6',
  cause:      '#ef4444',
};

const R       = 14;   // default node radius
const R_FOCUS = 19;   // selected node radius
const R_HOVER = 17;   // hover radius

const DIM_NODE   = 0.08;
const DIM_LINK   = 0.04;
const FULL_NODE  = 1;
const FULL_LINK  = 0.6;

const T_FAST = 150;   // ms — hover transitions
const T_MED  = 220;   // ms — focus transitions
const T_PAN  = 380;   // ms — re-centering transition

// ─── Component ────────────────────────────────────────────────────────────────

interface GraphViewProps {
  nodes: GraphNode[];
  threads: GraphThread[];
}

export default function GraphView({ nodes, threads }: GraphViewProps) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const [panel, setPanel] = useState<PanelData | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || nodes.length === 0) return;

    const W = svgEl.clientWidth  || 900;
    const H = svgEl.clientHeight || 560;

    // ── Wipe previous render ──────────────────────────────────────────────────
    const svg = d3.select<SVGSVGElement, unknown>(svgEl);
    svg.selectAll('*').remove();

    // ─────────────────────────────────────────────────────────────────────────
    // SVG defs: glow filter + arrow markers
    // ─────────────────────────────────────────────────────────────────────────
    const defs = svg.append('defs');

    // Soft glow filter
    const glowFilter = defs.append('filter')
      .attr('id', 'glow').attr('x', '-60%').attr('y', '-60%')
      .attr('width', '220%').attr('height', '220%');
    glowFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic').attr('stdDeviation', '3.5').attr('result', 'blur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'blur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Highlighted glow (brighter, used on selected node)
    const focusFilter = defs.append('filter')
      .attr('id', 'glow-focus').attr('x', '-60%').attr('y', '-60%')
      .attr('width', '220%').attr('height', '220%');
    focusFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic').attr('stdDeviation', '6').attr('result', 'blur');
    const focusMerge = focusFilter.append('feMerge');
    focusMerge.append('feMergeNode').attr('in', 'blur');
    focusMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers per thread type
    Object.entries(THREAD_COLORS).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', R + 12)
        .attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color).attr('opacity', 0.75);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Zoom / pan
    // ─────────────────────────────────────────────────────────────────────────
    const g = svg.append('g').attr('class', 'graph-root');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 6])
      .on('zoom', (ev: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', ev.transform.toString());
      });

    svg.call(zoom).on('dblclick.zoom', null);

    // ─────────────────────────────────────────────────────────────────────────
    // Simulation data
    // ─────────────────────────────────────────────────────────────────────────
    const simNodes: SimNode[] = nodes.map(n => ({
      id: n._id, title: n.title, description: n.description,
      tags: n.tags, createdBy: n.createdBy, createdAt: n.createdAt,
    }));

    const nodeIndex = new Map(simNodes.map(n => [n.id, n]));

    const simLinks: SimLink[] = threads.flatMap(t => {
      const src = t.fromNode?._id;
      const tgt = t.toNode?._id;
      if (!src || !tgt || !nodeIndex.has(src) || !nodeIndex.has(tgt)) return [];
      return [{ linkId: t._id, source: src, target: tgt, type: t.type || 'influence', description: t.description || '' }];
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Force simulation
    // ─────────────────────────────────────────────────────────────────────────
    const simulation = d3.forceSimulation<SimNode>(simNodes)
      .force('link',      d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(145).strength(0.55))
      .force('charge',    d3.forceManyBody<SimNode>().strength(-480))
      .force('center',    d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide<SimNode>(R + 22));

    // ─────────────────────────────────────────────────────────────────────────
    // Render links
    // ─────────────────────────────────────────────────────────────────────────
    const linkSel = g.append('g').attr('class', 'links')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks).join('line')
      .attr('stroke', d => THREAD_COLORS[d.type] ?? '#6b7280')
      .attr('stroke-width', 1.5)
      .style('opacity', FULL_LINK)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // ─────────────────────────────────────────────────────────────────────────
    // Render nodes
    // ─────────────────────────────────────────────────────────────────────────
    const nodeSel = g.append('g').attr('class', 'nodes')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes).join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    nodeSel.append('circle')
      .attr('r', R)
      .attr('fill', '#0d1117')
      .attr('stroke', '#dc2626')
      .attr('stroke-width', 1.8)
      .style('filter', 'url(#glow)');

    nodeSel.append('text')
      .text(d => d.title.length > 15 ? d.title.slice(0, 15) + '…' : d.title)
      .attr('dy', R + 14).attr('text-anchor', 'middle')
      .attr('fill', '#6b7280').attr('font-size', '11px')
      .attr('font-family', 'ui-sans-serif, system-ui, sans-serif')
      .style('pointer-events', 'none').style('user-select', 'none');

    // ─────────────────────────────────────────────────────────────────────────
    // Adjacency helpers (computed once, reused on every click/hover)
    // ─────────────────────────────────────────────────────────────────────────

    /** Returns {nodeIds, linkIds, connections} adjacent to `centerId`. */
    const adjacency = (centerId: string) => {
      const nodeIds = new Set<string>([centerId]);
      const linkIds = new Set<string>();
      const connections: { id: string; title: string; type: string }[] = [];

      simLinks.forEach(l => {
        const s = (l.source as SimNode).id;
        const t = (l.target as SimNode).id;
        if (s === centerId || t === centerId) {
          linkIds.add(l.linkId);
          const otherId = s === centerId ? t : s;
          if (!nodeIds.has(otherId)) {
            nodeIds.add(otherId);
            const other = simNodes.find(n => n.id === otherId);
            if (other) connections.push({ id: otherId, title: other.title, type: l.type });
          }
        }
      });
      return { nodeIds, linkIds, connections };
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Focus / reset helpers — update D3 elements only, never call setState
    // ─────────────────────────────────────────────────────────────────────────

    const resetGraph = () => {
      nodeSel.transition().duration(T_MED)
        .style('opacity', FULL_NODE);
      nodeSel.select('circle').transition().duration(T_MED)
        .attr('r', R)
        .attr('stroke', '#dc2626')
        .attr('stroke-width', 1.8)
        .style('filter', 'url(#glow)');
      nodeSel.select('text').transition().duration(T_MED)
        .attr('fill', '#6b7280');
      linkSel.transition().duration(T_MED)
        .style('opacity', FULL_LINK)
        .attr('stroke-width', 1.5);
    };

    const applyFocus = (centerId: string) => {
      const { nodeIds, linkIds } = adjacency(centerId);

      // Dim unrelated nodes
      nodeSel.transition().duration(T_MED)
        .style('opacity', d => nodeIds.has(d.id) ? FULL_NODE : DIM_NODE);

      // Style circles: selected vs neighbour vs dimmed
      nodeSel.select('circle').transition().duration(T_MED)
        .attr('r', d => d.id === centerId ? R_FOCUS : R)
        .attr('stroke', d => {
          if (d.id === centerId) return '#f87171';   // red-400 — selected
          if (nodeIds.has(d.id)) return '#dc2626';   // red-600 — neighbour
          return '#374151';                           // gray-700 — dimmed
        })
        .attr('stroke-width', d => d.id === centerId ? 2.8 : 1.8)
        .style('filter', d => d.id === centerId ? 'url(#glow-focus)' : 'url(#glow)');

      // Labels: brighten neighbours, dim others
      nodeSel.select('text').transition().duration(T_MED)
        .attr('fill', d => {
          if (d.id === centerId) return '#e5e7eb';   // gray-200
          if (nodeIds.has(d.id)) return '#9ca3af';   // gray-400
          return '#1f2937';                           // gray-800 — nearly invisible
        });

      // Dim unrelated links, widen connected ones
      linkSel.transition().duration(T_MED)
        .style('opacity', d => linkIds.has(d.linkId) ? 0.9 : DIM_LINK)
        .attr('stroke-width', d => linkIds.has(d.linkId) ? 2.2 : 1.5);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Re-center viewport to a node (smooth, respects current zoom level)
    // ─────────────────────────────────────────────────────────────────────────
    const recenterTo = (nodeX: number, nodeY: number) => {
      const currentTransform = d3.zoomTransform(svgEl);
      const k  = currentTransform.k;
      const tx = W / 2 - k * nodeX;
      const ty = H / 2 - k * nodeY;
      const target = d3.zoomIdentity.translate(tx, ty).scale(k);
      svg.transition().duration(T_PAN).call(zoom.transform, target);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // State tracker — plain JS variable inside closure, NO React state
    // Updating this never triggers a re-render.
    // ─────────────────────────────────────────────────────────────────────────
    let activeId: string | null = null;

    // ─────────────────────────────────────────────────────────────────────────
    // Hover — only when no node is active
    // ─────────────────────────────────────────────────────────────────────────
    nodeSel
      .on('mouseenter', (event: MouseEvent, d: SimNode) => {
        if (activeId) return; // active focus takes priority

        const { nodeIds, linkIds } = adjacency(d.id);

        nodeSel.transition().duration(T_FAST)
          .style('opacity', n => nodeIds.has(n.id) ? FULL_NODE : 0.25);
        nodeSel.select('circle').transition().duration(T_FAST)
          .attr('r', n => n.id === d.id ? R_HOVER : R)
          .attr('stroke', n => nodeIds.has(n.id) ? '#f87171' : '#374151');
        nodeSel.select('text').transition().duration(T_FAST)
          .attr('fill', n => nodeIds.has(n.id) ? '#9ca3af' : '#1f2937');

        linkSel.transition().duration(T_FAST)
          .style('opacity', l => linkIds.has(l.linkId) ? 0.9 : 0.06)
          .attr('stroke-width', l => linkIds.has(l.linkId) ? 2 : 1.5);
      })
      .on('mouseleave', (_event: MouseEvent, _d: SimNode) => {
        if (activeId) return;
        resetGraph();
      });

    // ─────────────────────────────────────────────────────────────────────────
    // Click node — activate focus + update React panel state
    // ─────────────────────────────────────────────────────────────────────────
    nodeSel.on('click', (event: MouseEvent, d: SimNode) => {
      event.stopPropagation();

      if (activeId === d.id) {
        // Second click on same node → deselect
        activeId = null;
        resetGraph();
        setPanel(null);
        return;
      }

      activeId = d.id;
      applyFocus(d.id);
      recenterTo(d.x ?? W / 2, d.y ?? H / 2);

      // Update React panel (only triggers panel re-render, not SVG re-render)
      const { connections } = adjacency(d.id);
      const fullNode = nodes.find(n => n._id === d.id) ?? null;
      if (fullNode) setPanel({ node: fullNode, connectedNodes: connections });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Click empty space → reset
    // ─────────────────────────────────────────────────────────────────────────
    svg.on('click', () => {
      if (!activeId) return;
      activeId = null;
      resetGraph();
      setPanel(null);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Drag (works independently of focus state)
    // ─────────────────────────────────────────────────────────────────────────
    const drag = d3.drag<SVGGElement, SimNode>()
      .on('start', (ev, d) => {
        if (!ev.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (ev, d) => {
        d.fx = ev.x; d.fy = ev.y;
      })
      .on('end', (ev, d) => {
        if (!ev.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      });

    nodeSel.call(drag);

    // ─────────────────────────────────────────────────────────────────────────
    // Simulation tick
    // ─────────────────────────────────────────────────────────────────────────
    simulation.on('tick', () => {
      linkSel
        .attr('x1', d => (d.source as SimNode).x ?? 0)
        .attr('y1', d => (d.source as SimNode).y ?? 0)
        .attr('x2', d => (d.target as SimNode).x ?? 0)
        .attr('y2', d => (d.target as SimNode).y ?? 0);

      nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup
    // ─────────────────────────────────────────────────────────────────────────
    return () => {
      simulation.stop();
      svg.on('click', null).on('.zoom', null);
    };
  }, [nodes, threads]); // only re-runs when graph data changes

  // ── Panel close (also resets the D3 graph state via a DOM click on svg) ──────
  const handleClosePanel = () => {
    setPanel(null);
    // Manually reset the graph visuals — we can't call the closure's resetGraph
    // from outside, so instead clear opacity via D3 selection from here.
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll<SVGGElement, SimNode>('.node')
        .transition().duration(T_MED).style('opacity', FULL_NODE);
      svg.selectAll<SVGGElement, SimNode>('.node').select('circle')
        .transition().duration(T_MED)
        .attr('r', R).attr('stroke', '#dc2626').attr('stroke-width', 1.8)
        .style('filter', 'url(#glow)');
      svg.selectAll<SVGGElement, SimNode>('.node').select('text')
        .transition().duration(T_MED).attr('fill', '#6b7280');
      svg.selectAll<SVGLineElement, SimLink>('.links line')
        .transition().duration(T_MED)
        .style('opacity', FULL_LINK).attr('stroke-width', 1.5);
    }
  };

  return (
    <div className="relative w-full" style={{ height: '580px' }}>
      {/* ── Canvas ─────────────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        className="w-full h-full rounded-lg"
        style={{ background: '#020617' }}
      />

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 bg-gray-900/85 border border-gray-700/60 rounded px-3 py-2 backdrop-blur-sm">
        <span className="text-gray-600 text-[10px] uppercase tracking-wider">Thread types</span>
        {Object.entries(THREAD_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="inline-block w-5 h-px rounded-full" style={{ background: color }} />
            <span className="text-gray-400 text-xs capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* ── Hint ───────────────────────────────────────────────────────────── */}
      {!panel && (
        <div className="absolute top-3 left-3 text-gray-700 text-xs select-none pointer-events-none">
          Hover to preview · Click to focus · Scroll to zoom · Drag to pan
        </div>
      )}

      {/* ── Side panel (Framer Motion — only this div animated, SVG untouched) ── */}
      <AnimatePresence>
      {panel && (
        <motion.div
          key="graph-panel"
          initial={{ opacity: 0, x: 56 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 56 }}
          transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-0 right-0 h-full w-64 bg-gray-900/95 border-l border-gray-700 flex flex-col overflow-hidden rounded-r-lg backdrop-blur-sm"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
            <span className="text-[10px] font-semibold text-red-500 uppercase tracking-widest">Node</span>
            <button
              id="close-panel-btn"
              onClick={handleClosePanel}
              className="text-gray-600 hover:text-gray-200 text-xl leading-none"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Title */}
            <div>
              <h3 className="text-gray-100 font-semibold text-sm leading-snug">
                {panel.node.title}
              </h3>
              <p className="text-gray-600 text-xs mt-1">
                {panel.node.createdBy?.username}
                {' · '}
                {new Date(panel.node.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-xs leading-relaxed">
              {panel.node.description.length > 250
                ? panel.node.description.slice(0, 250) + '…'
                : panel.node.description}
            </p>

            {/* Tags */}
            {panel.node.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {panel.node.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-800 border border-gray-700 text-gray-500 text-[10px] px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Connected nodes */}
            {panel.connectedNodes.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-2">
                  Connected ({panel.connectedNodes.length})
                </p>
                <ul className="space-y-1.5">
                  {panel.connectedNodes.map(cn => (
                    <li key={cn.id} className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: THREAD_COLORS[cn.type] ?? '#6b7280' }}
                      />
                      <span className="text-gray-400 text-xs truncate">{cn.title}</span>
                      <span className="text-gray-700 text-[9px] capitalize shrink-0">{cn.type}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {panel.connectedNodes.length === 0 && (
              <p className="text-gray-700 text-xs">No threads connected to this node.</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-800 shrink-0 flex flex-col gap-2">
            <Link
              href={`/nodes/${panel.node._id}`}
              className="block text-center bg-red-600 text-white text-xs py-2 rounded hover:bg-red-700 font-medium"
            >
              View Full Node
            </Link>
            <Link
              href={`/threads/new?fromNode=${panel.node._id}`}
              className="block text-center border border-gray-700 text-gray-400 text-xs py-2 rounded hover:bg-gray-800"
            >
              + Draw Thread
            </Link>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
