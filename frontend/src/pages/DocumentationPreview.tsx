import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { documentationApi, projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import { 
  ArrowLeft, 
  Terminal, 
  FileText, 
  Eye, 
  Download, 
  Loader2, 
  AlertCircle,
  FileCode,
  CheckCircle,
  ArrowRight
} from "lucide-react";

type DocType = "readme" | "api";

// Custom Tailwind-styled components for markdown rendering
const MarkdownComponents = {
  h1: ({ children }: any) => (
    <h1 className="text-3xl font-extrabold border-b border-slate-200 pb-3 mt-8 mb-4 text-slate-900 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-2xl font-bold mt-8 mb-3.5 text-slate-800 tracking-tight flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-xl font-bold mt-6 mb-2 text-slate-800 tracking-tight">
      {children}
    </h3>
  ),
  p: ({ children }: any) => (
    <p className="text-sm text-slate-600 leading-relaxed mb-4">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 mb-5 text-sm text-slate-600 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 mb-5 text-sm text-slate-600 space-y-1.5">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-sm text-slate-600 leading-relaxed">
      {children}
    </li>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-6 border border-slate-200 rounded-xl shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-50/80 font-mono text-xs uppercase text-slate-500 font-semibold tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-100 bg-white">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-50/50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-5 py-3.5 font-bold">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-5 py-3.5 text-slate-600 font-medium">
      {children}
    </td>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    return inline ? (
      <code 
        className="bg-indigo-50/70 text-indigo-600 font-mono text-xs px-1.5 py-0.5 rounded-md font-bold border border-indigo-100/40" 
        {...props}
      >
        {children}
      </code>
    ) : (
      <pre className="bg-slate-900 text-slate-100 font-mono text-xs p-5 rounded-2xl overflow-x-auto shadow-inner border border-slate-850 my-6">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  hr: () => <hr className="my-8 border-slate-200/80" />,
  strong: ({ children }: any) => (
    <strong className="font-bold text-slate-950">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-700">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-500 my-5 bg-indigo-50/30 py-3 pr-3 rounded-r-2xl">
      {children}
    </blockquote>
  ),
};

export default function DocumentationPreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DocType>("readme");
  const [downloading, setDownloading] = useState(false);

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("No project ID");
      const res = await projectsApi.getOne(id);
      return res.data?.project;
    },
    enabled: !!id,
  });

  // Fetch or generate documentation
  const { data: docs, isLoading, isError, refetch } = useQuery({
    queryKey: ["documentation", id],
    queryFn: async () => {
      if (!id) throw new Error("No project ID");
      const res = await documentationApi.getDocumentation(id);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to generate documentation");
      }
      return res.data;
    },
    enabled: !!id,
    retry: 1,
  });

  const handleDownload = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      if (activeTab === "readme") {
        await documentationApi.downloadReadme(id);
      } else {
        await documentationApi.downloadApi(id);
      }
    } catch (err) {
      console.error("Failed to download file:", err);
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
          <FileText className="h-4 w-4 text-indigo-500 absolute" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-800">Generating Markdown Documentation...</p>
          <p className="text-xs text-slate-400">Parsing AST structures, metadata maps, and routes registry.</p>
        </div>
      </div>
    );
  }

  if (isError || !docs) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-rose-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Documentation Error</h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          DevDoc AI encountered an issue generating documentation templates. Ensure your project codebase contains valid scanner records.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to={id ? `/projects/${id}/analysis` : "/dashboard"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-250 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <span>Retry Generation</span>
          </button>
        </div>
      </div>
    );
  }

  const activeContent = activeTab === "readme" ? docs.readme : docs.api;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}/analysis`}
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
              Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 space-y-6">
        
        {/* Breadcrumb Navigation & Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Projects</Link>
            <span className="text-slate-300">/</span>
            <Link to={`/projects/${id}`} className="hover:text-indigo-600 transition-colors truncate max-w-[150px]">
              {project?.name || "Project"}
            </Link>
            <span className="text-slate-300">/</span>
            <Link to={`/projects/${id}/analysis`} className="hover:text-indigo-600 transition-colors">Analysis</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Preview Documentation</span>
          </nav>

          {/* Action trigger: Download Current Markdown */}
          <button
            id="btn-download-active-doc"
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-500 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Download {activeTab === "readme" ? "README.md" : "API.md"}</span>
          </button>
        </div>

        {/* Dashboard Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono px-2 mb-3">
                Documentation Layouts
              </h3>
              
              <button
                id="tab-readme"
                onClick={() => setActiveTab("readme")}
                className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "readme"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">README.md Preview</span>
              </button>

              <button
                id="tab-api"
                onClick={() => setActiveTab("api")}
                className={`w-full flex items-center gap-3 px-4.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === "api"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileCode className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">API.md Specification</span>
              </button>
            </div>

            {/* Verification Stats Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">MVP Compliant</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                DevDoc AI generates accurate Markdown specs cleanly on-device. Safe, fast, and secure.
              </p>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-400">File Format</span>
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">MARKDOWN (.md)</span>
              </div>
            </div>
          </div>

          {/* Markdown Content Display Area */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Header info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600"></div>
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                    {activeTab === "readme" ? "Standard Overview" : "AST Routes Blueprint"}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {activeTab === "readme" ? "README.md" : "API.md"}
                </span>
              </div>

              {/* Rendered Markdown output */}
              <div className="markdown-body select-text">
                <ReactMarkdown components={MarkdownComponents}>
                  {activeContent}
                </ReactMarkdown>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
