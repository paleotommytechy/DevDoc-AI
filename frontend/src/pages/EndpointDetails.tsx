import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { endpointsApi, projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  ArrowLeft,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Code,
  Copy,
  Check,
  Play,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
  CheckCircle2,
  Server
} from "lucide-react";
import { motion } from "motion/react";

export default function EndpointDetails() {
  const { id: projectId, endpointId } = useParams<{ id: string; endpointId: string }>();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "request" | "response">("overview");
  const [copied, setCopied] = useState(false);

  // Fetch project details to render breadcrumb name
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) throw new Error("No project ID");
      const res = await projectsApi.getOne(projectId);
      if (!res.success || !res.data?.project) {
        throw new Error(res.message || "Project not found");
      }
      return res.data.project;
    },
    enabled: !!projectId,
  });

  // Fetch endpoint details from server
  const { data: endpoint, isLoading, isError, error } = useQuery({
    queryKey: ["endpoint", endpointId],
    queryFn: async () => {
      if (!endpointId) throw new Error("No endpoint ID");
      const res = await endpointsApi.getEndpointDetails(endpointId);
      if (!res.success || !res.data?.endpoint) {
        throw new Error(res.message || "Endpoint not found");
      }
      return res.data.endpoint;
    },
    enabled: !!endpointId,
  });

  const handleCopyJSON = (data: any) => {
    if (!data) return;
    try {
      const text = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text);
      addToast("JSON copied to clipboard!", "success");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      addToast("Failed to copy JSON.", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading endpoint blueprint...</p>
      </div>
    );
  }

  if (isError || !endpoint) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Endpoint Not Found</h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          {error instanceof Error ? error.message : "The requested endpoint does not exist or access was denied."}
        </p>
        <Link
          to={`/projects/${projectId}/analysis`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Analysis</span>
        </Link>
      </div>
    );
  }

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/50 ring-emerald-500/10";
      case "POST":
        return "bg-blue-50 text-blue-700 border-blue-200/50 ring-blue-500/10";
      case "PUT":
        return "bg-amber-50 text-amber-700 border-amber-200/50 ring-amber-500/10";
      case "PATCH":
        return "bg-purple-50 text-purple-700 border-purple-200/50 ring-purple-500/10";
      case "DELETE":
        return "bg-rose-50 text-rose-700 border-rose-200/50 ring-rose-500/10";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200/50 ring-slate-500/10";
    }
  };

  // Safe parameters extraction
  const queryParams = endpoint.query_parameters || [];
  const pathParams = endpoint.path_parameters || [];
  const statusCodes = endpoint.response_status_codes || [];
  const middlewareList = endpoint.middleware || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${projectId}/analysis`}
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
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10 sm:px-8 space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <span className="text-slate-300">/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-indigo-600 transition-colors truncate max-w-[150px]">
            {project?.name || "Project"}
          </Link>
          <span className="text-slate-300">/</span>
          <Link to={`/projects/${projectId}/analysis`} className="hover:text-indigo-600 transition-colors">
            Analysis
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-semibold truncate max-w-[200px]">Endpoint Details</span>
        </nav>

        {/* Hero Segment */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500"></div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-black border uppercase tracking-widest font-mono shadow-xs ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                {endpoint.authentication_required ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Auth Protected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                    <Unlock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Public Route</span>
                  </span>
                )}
                {endpoint.validation_library && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Code className="h-3.5 w-3.5" />
                    <span>{endpoint.validation_library} Validation</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight select-all truncate">
                {endpoint.route}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-500 font-mono">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Source:</span>
                  <span className="text-slate-700 break-all">{endpoint.source_file || "Unknown"}</span>
                </div>
                {endpoint.controller && (
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">Handler:</span>
                    <span className="text-slate-700">{endpoint.controller}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Endpoint Button Wrapper */}
            <div className="shrink-0">
              <button
                id="btn-test-endpoint"
                disabled
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-400 border border-slate-200 cursor-not-allowed shadow-inner transition-all select-none"
              >
                <Play className="h-4 w-4 fill-current text-slate-300" />
                <span>Coming Soon: Test Endpoint</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden flex flex-col">
          
          {/* Tabs Bar */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-1">
            <button
              id="tab-overview"
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-3 px-4 text-center rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
              }`}
            >
              Overview
            </button>
            <button
              id="tab-request"
              onClick={() => setActiveTab("request")}
              className={`flex-1 py-3 px-4 text-center rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "request"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
              }`}
            >
              Sample Request
            </button>
            <button
              id="tab-response"
              onClick={() => setActiveTab("response")}
              className={`flex-1 py-3 px-4 text-center rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === "response"
                  ? "bg-white text-slate-950 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/30"
              }`}
            >
              Sample Response
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="p-6 sm:p-8 min-h-[300px] flex flex-col">
            
            {/* 1. OVERVIEW PANEL */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Parameters Segment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Path Parameters */}
                  <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                      Path Parameters ({pathParams.length})
                    </h4>
                    {pathParams.length > 0 ? (
                      <div className="space-y-2">
                        {pathParams.map((param: string, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-200/30 last:border-0">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded-md">
                              :{param}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">String (Required)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic">No route path parameters detected.</p>
                    )}
                  </div>

                  {/* Query Parameters */}
                  <div className="space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl p-5">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                      Query Parameters ({queryParams.length})
                    </h4>
                    {queryParams.length > 0 ? (
                      <div className="space-y-2">
                        {queryParams.map((param: string, i: number) => (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-200/30 last:border-0">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              ?{param}=
                            </span>
                            <span className="text-xs text-slate-400 font-medium">Optional</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium italic">No query parameters detected.</p>
                    )}
                  </div>

                </div>

                {/* Status Codes */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                    Expected Response Status Codes
                  </h4>
                  {statusCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {statusCodes.map((code: number, i: number) => {
                        const isSuccess = code >= 200 && code < 300;
                        const isRedirection = code >= 300 && code < 400;
                        const isClientError = code >= 400 && code < 500;
                        let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                        if (isSuccess) badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-150";
                        else if (isRedirection) badgeStyle = "bg-blue-50 text-blue-700 border-blue-150";
                        else if (isClientError) badgeStyle = "bg-rose-50 text-rose-700 border-rose-150";
                        else badgeStyle = "bg-red-50 text-red-700 border-red-150"; // Server error

                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${badgeStyle}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : isClientError ? "bg-rose-500" : "bg-red-500"}`} />
                            <span className="font-mono">{code}</span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-150">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-mono">200 OK</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border bg-rose-50 text-rose-700 border-rose-150">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        <span className="font-mono">400 Bad Request</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Middleware Pipeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider font-mono">
                    Middleware Execution Pipeline ({middlewareList.length})
                  </h4>
                  {middlewareList.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {middlewareList.map((mid: string, i: number) => (
                        <React.Fragment key={i}>
                          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs font-mono">
                            <Layers className="h-3.5 w-3.5 text-slate-400" />
                            <span>{mid}</span>
                          </span>
                          {i < middlewareList.length - 1 && (
                            <span className="text-slate-300 font-mono text-sm px-1">➔</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium italic">No custom middlewares detected for this route.</p>
                  )}
                </div>

                {/* Controller Section */}
                {endpoint.controller && (
                  <div className="border-t border-slate-200/60 pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-200/50 shrink-0">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Controller Bind Handler</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          This route triggers the controller method: <code className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md text-xs">{endpoint.controller}</code>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 2. SAMPLE REQUEST PANEL */}
            {activeTab === "request" && (
              <div className="space-y-4 animate-fade-in flex flex-col flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Request JSON Body</h4>
                    <p className="text-xs text-slate-500">
                      Generated realistic JSON payload matching validation requirements.
                    </p>
                  </div>
                  {endpoint.sample_request && Object.keys(endpoint.sample_request).length > 0 && (
                    <button
                      id="btn-copy-request"
                      onClick={() => handleCopyJSON(endpoint.sample_request)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs px-3.5 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-[220px] rounded-2xl bg-slate-950 border border-slate-900 p-5 font-mono text-xs overflow-auto relative text-slate-100 shadow-inner">
                  {endpoint.sample_request && Object.keys(endpoint.sample_request).length > 0 ? (
                    <pre className="select-all leading-relaxed whitespace-pre">
                      {JSON.stringify(endpoint.sample_request, null, 2)}
                    </pre>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-center p-6 gap-2">
                      <Code className="h-10 w-10 text-slate-600 animate-pulse" />
                      <div className="space-y-0.5">
                        <p className="font-bold">No Request Body</p>
                        <p className="text-[11px] text-slate-600 max-w-xs">
                          This HTTP method ({endpoint.method}) does not support or require a request body.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. SAMPLE RESPONSE PANEL */}
            {activeTab === "response" && (
              <div className="space-y-4 animate-fade-in flex flex-col flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Expected Response Payload</h4>
                    <p className="text-xs text-slate-500">
                      Best-effort JSON response structure derived from database models and controller methods.
                    </p>
                  </div>
                  {endpoint.sample_response && Object.keys(endpoint.sample_response).length > 0 && (
                    <button
                      id="btn-copy-response"
                      onClick={() => handleCopyJSON(endpoint.sample_response)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-xs px-3.5 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="flex-1 min-h-[220px] rounded-2xl bg-slate-950 border border-slate-900 p-5 font-mono text-xs overflow-auto relative text-slate-100 shadow-inner">
                  {endpoint.sample_response && Object.keys(endpoint.sample_response).length > 0 ? (
                    <pre className="select-all leading-relaxed whitespace-pre">
                      {JSON.stringify(endpoint.sample_response, null, 2)}
                    </pre>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-center p-6 gap-2">
                      <Code className="h-10 w-10 text-slate-600" />
                      <div className="space-y-0.5">
                        <p className="font-bold">Empty Response Structure</p>
                        <p className="text-[11px] text-slate-600 max-w-xs">
                          An empty object was inferred. Returns standard HTTP status code headers.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </main>

    </div>
  );
}
