import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { endpointsApi, projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  Terminal,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { CodeSnippetGenerator } from "../components/CodeSnippetGenerator";
import { ApiPlayground } from "../components/ApiPlayground";

export default function EndpointDetails() {
  const { id: projectId, endpointId } = useParams<{ id: string; endpointId: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"playground" | "snippets" | "schemas">("playground");

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center gap-4 text-slate-100">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Loading endpoint definitions...</p>
      </div>
    );
  }

  if (isError || !endpoint) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center p-6 text-center text-slate-100">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold">Endpoint Not Found</h3>
        <Link
          to={`/projects/${projectId}/analysis`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Analysis</span>
        </Link>
      </div>
    );
  }

  const method = (endpoint.method || "GET").toUpperCase();
  const authRequired = endpoint.authentication_required ?? endpoint.authenticationRequired ?? false;
  const validationLib = endpoint.validation_library ?? endpoint.validationLibrary ?? null;
  const sourceFile = endpoint.source_file ?? endpoint.sourceFile ?? "controllers";
  const pathParameters = endpoint.path_parameters ?? endpoint.pathParameters ?? [];
  const sampleRequest = endpoint.sample_request ?? endpoint.sampleRequest ?? {};
  const sampleResponse = endpoint.sample_response ?? endpoint.sampleResponse ?? {};

  const getMethodBadgeClass = (m: string) => {
    switch (m) {
      case "GET": return "badge-method-get";
      case "POST": return "badge-method-post";
      case "PUT": return "badge-method-put";
      case "DELETE": return "badge-method-delete";
      default: return "badge-method-patch";
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${projectId}/analysis`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
                <Terminal className="h-5 w-5 text-slate-950" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-mono">
                DevDoc<span className="text-cyan-400">.AI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              {user?.email}
            </span>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-all"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 space-y-6">
        
        {/* Endpoint Banner Header */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-lg font-mono font-bold text-sm ${getMethodBadgeClass(method)}`}>
                {method}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
                {endpoint.route}
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              {authRequired ? (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/30">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Auth Protected</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Public Route</span>
                </span>
              )}

              {validationLib && (
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/30">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{validationLib} Validated</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
            <div>Source File: <span className="text-cyan-400">{sourceFile}</span></div>
            {endpoint.controller && <div>Controller: <span className="text-slate-200">{endpoint.controller}</span></div>}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab("playground")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "playground"
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Interactive Sandbox
          </button>
          <button
            onClick={() => setActiveTab("snippets")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "snippets"
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Client Snippets
          </button>
          <button
            onClick={() => setActiveTab("schemas")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "schemas"
                ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            JSON Schemas & Samples
          </button>
        </div>

        {/* Active Tab Content */}
        {activeTab === "playground" && (
          <ApiPlayground
            method={method}
            route={endpoint.route}
            pathParameters={pathParameters}
            sampleRequest={sampleRequest}
          />
        )}

        {activeTab === "snippets" && (
          <CodeSnippetGenerator
            method={method}
            route={endpoint.route}
            sampleRequest={sampleRequest}
          />
        )}

        {activeTab === "schemas" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">Sample Request Payload</h3>
              <pre className="p-4 rounded-xl bg-[#07090e] border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                <code>{JSON.stringify(sampleRequest, null, 2)}</code>
              </pre>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">Sample Response Payload</h3>
              <pre className="p-4 rounded-xl bg-[#07090e] border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto">
                <code>{JSON.stringify(sampleResponse, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
