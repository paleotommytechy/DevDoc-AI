import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, documentationApi, endpointsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  ArrowLeft, 
  Terminal, 
  Search, 
  Database as DbIcon, 
  ShieldAlert, 
  ShieldCheck,
  Code, 
  Layers, 
  Cpu, 
  FolderSync,
  AlertCircle,
  Calendar,
  Loader2,
  Lock,
  Globe,
  Eye,
  Download
} from "lucide-react";
import { motion } from "motion/react";

export default function ProjectAnalysis() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [downloadingReadme, setDownloadingReadme] = useState(false);
  const [downloadingApi, setDownloadingApi] = useState(false);

  const handleDownloadReadme = async () => {
    if (!id) return;
    try {
      setDownloadingReadme(true);
      await documentationApi.downloadReadme(id);
    } catch (err) {
      console.error("Error downloading README:", err);
    } finally {
      setDownloadingReadme(false);
    }
  };

  const handleDownloadApi = async () => {
    if (!id) return;
    try {
      setDownloadingApi(true);
      await documentationApi.downloadApi(id);
    } catch (err) {
      console.error("Error downloading API Docs:", err);
    } finally {
      setDownloadingApi(false);
    }
  };

  // Fetch project details (which contains the scanner results)
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("No project ID");
      const res = await projectsApi.getOne(id);
      if (!res.success || !res.data?.project) {
        throw new Error(res.message || "Project not found");
      }
      return res.data.project;
    },
    enabled: !!id,
  });

  // Fetch detailed endpoints from the server
  const { data: detailedEndpoints, isLoading: isLoadingEndpoints } = useQuery({
    queryKey: ["projectEndpoints", id],
    queryFn: async () => {
      if (!id) throw new Error("No project ID");
      const res = await endpointsApi.getProjectEndpoints(id);
      return res.success ? res.data?.endpoints || [] : [];
    },
    enabled: !!id,
  });

  if (isLoading || isLoadingEndpoints) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading project analysis...</p>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Analysis Not Found</h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          DevDoc AI could not fetch analysis records for this project.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  // Get routes list from detailed endpoints or project
  let routesList: any[] = [];
  if (detailedEndpoints && detailedEndpoints.length > 0) {
    routesList = detailedEndpoints.map((ep: any) => ({
      id: ep.id,
      method: ep.method,
      endpoint: ep.route,
      sourceFile: ep.source_file,
    }));
  } else if (project.routes_discovered) {
    try {
      routesList = typeof project.routes_discovered === "string" 
        ? JSON.parse(project.routes_discovered) 
        : project.routes_discovered;
    } catch (e) {
      console.error("Error parsing routes list:", e);
    }
  }

  // Filtering routes
  const filteredRoutes = routesList.filter((route) => {
    const matchesSearch = 
      route.endpoint?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.sourceFile?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMethod = methodFilter === "ALL" || route.method?.toUpperCase() === methodFilter.toUpperCase();
    
    return matchesSearch && matchesMethod;
  });

  // Extract unique HTTP methods for filter pill bar
  const availableMethods = ["ALL", ...Array.from(new Set(routesList.map((r) => r.method?.toUpperCase() || "GET")))];

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
      case "POST":
        return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "PUT":
        return "bg-amber-50 text-amber-700 border-amber-200/50";
      case "PATCH":
        return "bg-purple-50 text-purple-700 border-purple-200/50";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200/50";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
  };

  // Status Badge helpers
  const getStatusBadge = (status: string | null | undefined) => {
    const norm = status?.toLowerCase() || "pending";
    if (norm === "completed" || norm === "analyzed") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 font-sans">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Analysis Complete</span>
        </span>
      );
    } else if (norm === "failed" || norm === "error") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20 font-sans">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
          <span>Analysis Failed</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 font-sans">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-spin"></span>
          <span>Analyzing</span>
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-100">
                <Terminal className="h-5.5 w-5.5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 bg-clip-text text-transparent">
                DevDoc AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-semibold text-slate-700">{user?.email}</span>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              My Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 space-y-8">
        
        {/* Navigation Breadcrumb & Status */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Projects</Link>
            <span className="text-slate-300">/</span>
            <Link to={`/projects/${project.id}`} className="hover:text-indigo-600 transition-colors truncate max-w-[150px]">
              {project.name}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Discovery Analysis</span>
          </nav>
          <div>
            {getStatusBadge(project.analysis_status)}
          </div>
        </div>

        {/* Title Section */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-950 tracking-tight">{project.name}</h1>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                Discovered backend blueprints, controller instances, API routes, and architectural patterns.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {project.analysis_completed_at && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-xs">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Analyzed: {new Date(project.analysis_completed_at).toLocaleString()}</span>
                </div>
              )}
              {project.analysis_status?.toLowerCase() === "completed" && (
                <>
                  <Link
                    id="btn-preview-docs"
                    to={`/projects/${id}/documentation`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Preview Docs</span>
                  </Link>
                  <button
                    id="btn-download-readme"
                    onClick={handleDownloadReadme}
                    disabled={downloadingReadme}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {downloadingReadme ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-500" />
                    )}
                    <span>Download README</span>
                  </button>
                  <button
                    id="btn-download-api"
                    onClick={handleDownloadApi}
                    disabled={downloadingApi}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {downloadingApi ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 text-slate-500" />
                    )}
                    <span>Download API Docs</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Core Technology Stack Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Framework Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Framework</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{project.framework || "Unknown"}</div>
            </div>
          </div>

          {/* Language Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500"></div>
            <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Language</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{project.language || "Unknown"}</div>
            </div>
          </div>

          {/* Database Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <DbIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Database</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{project.database || "Unknown"}</div>
            </div>
          </div>

          {/* Authentication Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Authentication</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{project.authentication || "Unknown"}</div>
            </div>
          </div>

        </div>

        {/* Statistics Cards (Grid of Counts) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Routes Count Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1 relative overflow-hidden">
            <div className="text-sm font-semibold text-slate-500">API Routes Discovered</div>
            <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">{project.route_count ?? 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">Automatic AST scans</div>
          </div>

          {/* Controllers Count Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1 relative overflow-hidden">
            <div className="text-sm font-semibold text-slate-500">Controller Modules</div>
            <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">{project.controller_count ?? 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">Classes and handler files</div>
          </div>

          {/* Models Count Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1 relative overflow-hidden">
            <div className="text-sm font-semibold text-slate-500">Database Models / Schemas</div>
            <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">{project.model_count ?? 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">Entities, schemas, or ODM structures</div>
          </div>

          {/* Middleware Count Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-1 relative overflow-hidden">
            <div className="text-sm font-semibold text-slate-500">Middleware Layers</div>
            <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">{project.middleware_count ?? 0}</div>
            <div className="text-[11px] text-slate-400 font-medium">Security, rate-limit, or interceptors</div>
          </div>

        </div>

        {/* Interactive Endpoints Table Section */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-500" />
                  <span>API Blueprint Registry</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Search, filter, and inspect discovered HTTP endpoints, route methods, and controller file sources.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-mono">
                FOUND: {filteredRoutes.length} of {routesList.length}
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search endpoint path or source file..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 transition-all"
                />
              </div>

              {/* Method filter selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {availableMethods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      methodFilter === m
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto">
            {filteredRoutes.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-150 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <th className="px-6 py-3.5 w-28">Method</th>
                    <th className="px-6 py-3.5">Endpoint Path</th>
                    <th className="px-6 py-3.5">Source File Location</th>
                    <th className="px-6 py-3.5 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoutes.map((route, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider font-mono ${getMethodColor(route.method)}`}>
                          {route.method || "GET"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-sm font-semibold text-slate-950">
                        {route.id ? (
                          <Link 
                            to={`/projects/${id}/endpoints/${route.id}`}
                            className="text-indigo-600 hover:text-indigo-800 hover:underline transition-all"
                          >
                            {route.endpoint}
                          </Link>
                        ) : (
                          route.endpoint
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-400 font-mono">
                        {route.sourceFile}
                      </td>
                      <td className="px-6 py-3.5 text-right pr-8">
                        {route.id ? (
                          <Link
                            to={`/projects/${id}/endpoints/${route.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline animate-fade-in"
                          >
                            <span>Inspect Blueprint</span>
                            <span>➔</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Re-scan to Inspect</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-4">
                <AlertCircle className="h-12 w-12 text-slate-300" />
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">No API routes detected</h4>
                  <p className="text-sm text-slate-500 max-w-sm">
                    {routesList.length === 0 
                      ? "No API routes were detected in this project." 
                      : "No routes matched your current filter criteria."}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
