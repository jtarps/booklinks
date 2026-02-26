'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as d3 from 'd3';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface GraphNode {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string | null;
  connections: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface Props {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function ReferenceGraph({ nodes, links }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    node: GraphNode;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>();

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const container = containerRef.current!;
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    const g = svg.append('g');

    // Initial zoom to fit
    const initialScale = Math.min(width, height) / 800;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.max(0.4, initialScale))
        .translate(-width / 2, -height / 2)
    );

    // Size scale based on connections
    const maxConnections = Math.max(...nodes.map((n) => n.connections), 1);
    const radiusScale = d3.scaleSqrt().domain([0, maxConnections]).range([20, 45]);

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, any>(links)
          .id((d) => d.id)
          .distance(150)
      )
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => radiusScale(d.connections) + 10));

    // Arrow marker
    g.append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 25)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#cbd5e1');

    // Draw links
    const link = g
      .append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-width', 1.5)
      .attr('marker-end', 'url(#arrowhead)');

    // Draw node groups
    const node = g
      .append('g')
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node circles
    node
      .append('circle')
      .attr('r', (d) => radiusScale(d.connections))
      .attr('fill', (d) => colorScale(d.slug))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2.5)
      .attr('opacity', 0.9);

    // Connection count badge
    node
      .filter((d) => d.connections > 1)
      .append('circle')
      .attr('r', 10)
      .attr('cx', (d) => radiusScale(d.connections) - 5)
      .attr('cy', (d) => -(radiusScale(d.connections) - 5))
      .attr('fill', '#4f46e5')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    node
      .filter((d) => d.connections > 1)
      .append('text')
      .attr('x', (d) => radiusScale(d.connections) - 5)
      .attr('y', (d) => -(radiusScale(d.connections) - 5))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', '#fff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .text((d) => d.connections);

    // Book title labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => radiusScale(d.connections) + 14)
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#1f2937')
      .text((d) => (d.title.length > 20 ? d.title.slice(0, 18) + '...' : d.title));

    // Author labels
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => radiusScale(d.connections) + 27)
      .attr('font-size', '9px')
      .attr('fill', '#6b7280')
      .text((d) => d.author);

    // Hover and click
    node
      .on('mouseover', function (event, d) {
        d3.select(this).select('circle').attr('opacity', 1).attr('stroke-width', 3.5);

        // Highlight connected links
        link
          .attr('stroke', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? '#6366f1' : '#e2e8f0'
          )
          .attr('stroke-width', (l: any) =>
            l.source.id === d.id || l.target.id === d.id ? 2.5 : 1.5
          );

        const rect = svgRef.current!.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          node: d,
        });
      })
      .on('mouseout', function () {
        d3.select(this).select('circle').attr('opacity', 0.9).attr('stroke-width', 2.5);
        link.attr('stroke', '#e2e8f0').attr('stroke-width', 1.5);
        setTooltip(null);
      })
      .on('click', (_event, d) => {
        router.push(`/book/${d.slug}`);
      });

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, router, isFullscreen]);

  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1.5);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 0.67);
  };

  const handleReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const container = containerRef.current!;
    const width = container.clientWidth;
    const height = container.clientHeight;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.5).translate(-width / 2, -height / 2)
      );
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  if (nodes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-12 text-center">
        <p className="text-gray-500">
          No book references found yet. Add some books and discover connections to see the reference map.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
      style={{ height: isFullscreen ? '100vh' : '70vh' }}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title="Reset view"
        >
          <RotateCcw className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border border-gray-200"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-gray-700" />
          ) : (
            <Maximize2 className="h-4 w-4 text-gray-700" />
          )}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 px-4 py-3 text-xs text-gray-600">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            Connection count
          </span>
          <span>Larger = more connections</span>
          <span>Drag nodes to rearrange</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 px-4 py-2 text-sm text-gray-700">
        <strong>{nodes.length}</strong> books &middot; <strong>{links.length}</strong> connections
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-20 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm pointer-events-none shadow-xl max-w-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 12,
          }}
        >
          <p className="font-semibold">{tooltip.node.title}</p>
          <p className="text-gray-300 text-xs">by {tooltip.node.author}</p>
          <p className="text-indigo-300 text-xs mt-1">
            {tooltip.node.connections} connection{tooltip.node.connections !== 1 ? 's' : ''} &middot; Click to view
          </p>
        </div>
      )}

      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
