"use client";
import React, { useEffect, useId, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidChartProps {
    chart: string; // Le code Mermaid pour ton diagramme
    filename: string; // Le nom de fichier pour le téléchargement
}

// TODOs: faire une bare de défilement latérale pour afficher la fenêtre du code
const MermaidChart: React.FC<MermaidChartProps> = ({ chart, filename }) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const lastGoodSvgRef = useRef<string | null>(null);
    const initializedRef = useRef(false);
    const uniqueId = `mermaid-${useId()}`;

    useEffect(() => {
        // Initialize Mermaid once on the client
        if (!initializedRef.current) {
            try {
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose',
                });
                initializedRef.current = true;
            } catch (e) {
                // If initialization fails, we still try to render later and show errors gracefully

                console.error('Mermaid initialize failed:', e);
            }
        }
    }, []);

    useEffect(() => {
        if (!chartRef.current) return;

        // Debounce renders slightly to avoid parsing while content is still streaming
        const handle = window.setTimeout(async () => {
            if (!chartRef.current) return;

            try {
                // Validate before rendering. parse may throw if the diagram is incomplete/invalid.
                try {
                    // mermaid.parse can be sync or async depending on version; await handles both
                    await Promise.resolve(mermaid.parse(chart));
                } catch (parseErr) {
                    // Keep showing last good render while streaming incomplete content
                    if (lastGoodSvgRef.current) {
                        chartRef.current.innerHTML = lastGoodSvgRef.current;
                    } else {
                        chartRef.current.innerHTML = '<div style="color:#999;font-size:12px;">Diagramme Mermaid en cours…</div>';
                    }
                    return;
                }

                // Clear previous content then render
                chartRef.current.innerHTML = '';
                const { svg, bindFunctions } = await mermaid.render(uniqueId, chart);
                if (chartRef.current) {
                    chartRef.current.innerHTML = svg;
                    lastGoodSvgRef.current = svg;
                    // Bind interactions if any (e.g., clicks)
                    if (typeof bindFunctions === 'function') {
                        bindFunctions(chartRef.current);
                    }
                }
            } catch (error) {

                console.error('Error rendering Mermaid diagram:', error);
                if (chartRef.current) {
                    // Prefer last good diagram when available
                    if (lastGoodSvgRef.current) {
                        chartRef.current.innerHTML = lastGoodSvgRef.current;
                    } else {
                        chartRef.current.innerHTML = '<p style="color: red;">Erreur lors du rendu du diagramme Mermaid.</p>';
                    }
                }
            }
        }, 250);

        return () => window.clearTimeout(handle);
    }, [chart, uniqueId]);

    return (
        <div className="my-4">
            <h3 className="text-lg font-bold mb-2 border-t border-x border-gray-200 dark:border-gray-700 rounded-t-md px-3 py-2">Diagram: {filename && <span className="text-gray-400 bg-gray-800 px-1 py-0.5 rounded-md">{filename}</span>}</h3>
            <div
                ref={chartRef}
                className="mermaid-chart-container overflow-x-auto p-3 border rounded-md border-gray-200 dark:border-gray-700"
                aria-live="polite"
            />
        </div>
    );
};

export default MermaidChart;