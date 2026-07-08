import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { architectureApi, ArchitectureDiagram } from "../services/api";
import Mermaid from "./Mermaid";
import { 
  FolderTree, 
  Map, 
  Workflow, 
  Database, 
  ShieldAlert, 
  Repeat, 
  GitBranch, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  FileCode, 
  AlertCircle 
} from "lucide-react";
import { showGlobalToast } from "../context/ToastContext";

interface VisualizerProps {
  projectId: string;
}

export default function ArchitectureVisualizer({ projectId }: VisualizerProps) {
  const queryClient = useQueryClient();
  const [activeType, setActiveType] = useState<string>("folder_tree");
  const [copied, setCopied] = useState<boolean>(false);

  // Fetch all diagrams for this project
  const { 
    data: diagrams, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ["projectDiagrams", projectId],
    queryFn: async () => {
      const res = await architectureApi.getProjectDiagrams(projectId);
      return res.success ? res.data || [] : [];
    },
    enabled: !!projectId,
  });

  // Force regenerate mutation
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await architectureApi.regenerateDiagrams(projectId);
      if (!res.success) {
        throw new Error(res.message || "Failed to regenerate diagrams");
      }
      return res.data || [];
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["projectDiagrams", projectId], data);
      showGlobalToast("Architecture diagrams successfully refreshed!", "success");
    },
    onError: (err: any) => {
      showGlobalToast(err.message || "Failed to regenerate diagrams.", "error");
    }
  });

  // Get active diagram
  const activeDiagram = diagrams?.find(d => d.diagram_type === activeType);

  // Copy Mermaid syntax to clipboard
  const handleCopyCode = () => {
    if (!activeDiagram) return;
    navigator.clipboard.writeText(activeDiagram.mermaid_code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        showGlobalToast("Failed to copy code to clipboard.", "error");
      });
  };

  // Download raw Mermaid code (.mmd)
  const handleDownloadMmd = () => {
    if (!activeDiagram) return;
    const blob = new Blob([activeDiagram.mermaid_code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectId}_${activeType}.mmd`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download as framed Markdown (.md)
  const handleDownloadMarkdown = () => {
    if (!activeDiagram) return;
    const titleMap: { [key: string]: string } = {
      folder_tree: "Project Structure",
      route_controller: "Route to Controller Relationships",
      controller_service: "Controller to Service Relationships",
      service_database: "Service to Database Relationships",
      middleware_flow: "Middleware Execution Flow",
      request_lifecycle: "Request Lifecycle Sequence",
      dependency_graph: "High-Level Project Dependency Graph"
    };

    const friendlyTitle = titleMap[activeType] || "Architecture Diagram";
    const content = `# DevDoc AI - Architecture Visualizer\n\n## ${friendlyTitle}\n\nGenerated on: ${new Date().toLocaleString()}\n\n\`\`\`mermaid\n${activeDiagram.mermaid_code}\n\`\`\`\n\n---\n*Created automatically by DevDoc AI Workspace Analyzer.*`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectId}_${activeType}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const menuItems = [
    { type: "folder_tree", label: "Project Structure", icon: FolderTree },
    { type: "route_controller", label: "Route Flow", icon: Map },
    { type: "controller_service", label: "Controller ➔ Service", icon: Workflow },
    { type: "service_database", label: "Service ➔ Database", icon: Database },
    { type: "middleware_flow", label: "Middleware Flow", icon: ShieldAlert },
    { type: "request_lifecycle", label: "Request Lifecycle", icon: Repeat },
    { type: "dependency_graph", label: "Dependency Graph", icon: GitBranch },
  ];

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col justify-center items-center gap-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <Loader2Icon />
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">Generating blueprints...</p>
          <p className="text-xs text-slate-400 mt-1">First-time rendering compiles and indexes routes, controllers, and database layers dynamically.</p>
        </div>
      </div>
    );
  }

  if (isError || !diagrams || diagrams.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center gap-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <AlertCircle className="h-12 w-12 text-slate-300" />
        <div className="space-y-2">
          <h4 className="text-base font-bold text-slate-900">No architectural metadata parsed</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            API endpoints are required to generate architectural diagrams. Please upload a project ZIP codebase containing router files to generate maps.
          </p>
        </div>
        <button
          onClick={() => regenerateMutation.mutate()}
          disabled={regenerateMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
          <span>Force Generate Blueprint Map</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      
      {/* LEFT SIDEBAR: Nav list of diagrams */}
      <div className="lg:col-span-1 space-y-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-mono">Architecture Maps</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeType === item.type;
            return (
              <button
                key={item.type}
                onClick={() => {
                  setActiveType(item.type);
                  setCopied(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global actions card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="text-xs text-slate-500 leading-relaxed font-sans">
            Diagrams are automatically compiled. Hit refresh to re-analyze if endpoints or sources change.
          </div>
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{regenerateMutation.isPending ? "Refreshing..." : "Re-Analyze Architecture"}</span>
          </button>
        </div>
      </div>

      {/* RIGHT PREVIEW PANE: Render canvas and export toolbelt */}
      <div className="lg:col-span-3 space-y-4">
        
        {/* Export / controls toolbelt */}
        {activeDiagram && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {menuItems.find(m => m.type === activeType)?.label || "Architecture View"}
              </h4>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                Saved ID: {activeDiagram.id?.substring(0, 8)}... | Compiled: {new Date(activeDiagram.generated_at || "").toLocaleString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyCode}
                className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
                title="Copy raw Mermaid code"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-emerald-600 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadMmd}
                className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
                title="Download raw Mermaid diagram file (.mmd)"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Download .mmd</span>
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="flex-1 sm:flex-initial inline-flex justify-center items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all cursor-pointer"
                title="Download Markdown document (.md)"
              >
                <FileCode className="h-3.5 w-3.5 text-slate-400" />
                <span>Download Markdown</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic canvas viewport */}
        {activeDiagram ? (
          <Mermaid chart={activeDiagram.mermaid_code} />
        ) : (
          <div className="p-16 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-white">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No active chart found for this category.</p>
          </div>
        )}

      </div>

    </div>
  );
}

function Loader2Icon() {
  return (
    <div className="relative flex items-center justify-center">
      <span className="absolute inline-flex h-12 w-12 rounded-full bg-indigo-500 opacity-20 animate-ping"></span>
      <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" />
    </div>
  );
}
