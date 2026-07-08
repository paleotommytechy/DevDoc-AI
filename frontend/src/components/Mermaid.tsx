import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

// Initialize mermaid with custom clean parameters
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: "basis",
  },
});

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setError(null);
    setSvg("");

    const renderChart = async () => {
      if (!chart.trim()) return;
      try {
        // Generate a unique ID to avoid collision during re-renders
        const uniqueId = `mermaid-${Math.floor(Math.random() * 1000000)}`;
        const { svg: renderedSvg } = await mermaid.render(uniqueId, chart);
        
        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        // Clear SVG on error to show error message
        if (isMounted) {
          // Extract cleaner error message if possible
          setError(err?.message || "Syntax error or parsing failure in Mermaid code.");
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50 text-rose-800 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
        <p className="font-bold text-sm text-rose-900 mb-2">📊 Diagram Render Warning</p>
        <p className="mb-3">Could not compile the layout structure because of Mermaid syntax constraints:</p>
        <code className="block bg-rose-100/50 p-3 rounded-lg border border-rose-200/50">{error}</code>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex flex-col justify-center items-center p-16 gap-3">
        <div className="relative flex items-center justify-center">
          <span className="absolute inline-flex h-8 w-8 rounded-full bg-indigo-500 opacity-20 animate-ping"></span>
          <div className="h-6 w-6 rounded-lg bg-indigo-600 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium animate-pulse">Rendering canvas layout...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-slate-100 overflow-x-auto flex justify-center shadow-xs">
      <div 
        className="w-full max-w-full flex justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-4xl [&_rect]:rx-lg" 
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </div>
  );
}
