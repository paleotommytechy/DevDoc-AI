import React, { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { documentationApi, projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
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
  Copy,
  Check,
  Layout,
  Code,
  Sparkles,
  Layers
} from "lucide-react";

type DocType = "readme" | "api";
type ViewMode = "preview" | "raw";

// A utility to turn text into clear header anchors
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

// Interactive standalone CodeBlock component to support copy action inside Markdown
function CodeBlock({ children, className }: any) {
  const [copied, setCopied] = useState(false);
  const codeText = String(children).replace(/\n$/, "");
  const langMatch = /language-(\w+)/.exec(className || "");
  const language = langMatch ? langMatch[1] : "code";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code block:", err);
    }
  };

  return (
    <div className="relative my-6 border border-slate-850 rounded-xl overflow-hidden shadow-md bg-slate-950 font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-850 text-slate-400">
        <span className="uppercase text-[10px] font-bold tracking-widest text-slate-500">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] hover:text-white hover:bg-slate-800 transition-all cursor-pointer bg-slate-950 border border-slate-800/80"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-slate-200 text-xs leading-relaxed select-text">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// Custom Markdown renderer components with dynamic scrolling anchor support
const MarkdownComponents = {
  h1: ({ children }: any) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugify(text);
    return (
      <h1 id={id} className="text-3xl font-extrabold border-b border-slate-150 pb-3 mt-8 mb-4 text-slate-900 tracking-tight scroll-mt-24 font-sans">
        {children}
      </h1>
    );
  },
  h2: ({ children }: any) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugify(text);
    return (
      <h2 id={id} className="text-2xl font-bold mt-8 mb-3.5 text-slate-850 tracking-tight flex items-center gap-2 scroll-mt-24 border-b border-slate-100 pb-2 font-sans">
        {children}
      </h2>
    );
  },
  h3: ({ children }: any) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugify(text);
    return (
      <h3 id={id} className="text-xl font-bold mt-6 mb-2 text-slate-800 tracking-tight scroll-mt-24 font-sans">
        {children}
      </h3>
    );
  },
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
    <thead className="bg-slate-50/80 font-mono text-[11px] uppercase text-slate-500 font-semibold tracking-wider">
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
    <td className="px-5 py-3.5 text-slate-650 font-medium">
      {children}
    </td>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    return inline ? (
      <code 
        className="bg-indigo-50 text-indigo-600 font-mono text-[12px] px-1.5 py-0.5 rounded-md font-bold border border-indigo-100/50" 
        {...props}
      >
        {children}
      </code>
    ) : (
      <CodeBlock className={className}>{children}</CodeBlock>
    );
  },
  hr: () => <hr className="my-8 border-slate-200/85" />,
  strong: ({ children }: any) => (
    <strong className="font-bold text-slate-950">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-750">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-slate-500 my-5 bg-indigo-50/20 py-3 pr-3 rounded-r-xl">
      {children}
    </blockquote>
  ),
};

export default function DocumentationPreview() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<DocType>("readme");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [downloading, setDownloading] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

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

  const activeContent = activeTab === "readme" ? docs?.readme || "" : docs?.api || "";

  // Dynamic parse of markdown content to build Document Outline
  const toc = useMemo(() => {
    if (!activeContent) return [];
    const lines = activeContent.split("\n");
    const headers: { id: string; text: string; level: number }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[_*`]/g, "").trim(); // strip standard markdown formatting characters
        const id = slugify(text);
        headers.push({ id, text, level });
      }
    });
    return headers;
  }, [activeContent]);

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

  const handleCopyFull = async () => {
    if (!activeContent) return;
    try {
      await navigator.clipboard.writeText(activeContent);
      setCopiedFull(true);
      setTimeout(() => setCopiedFull(false), 2000);
    } catch (err) {
      console.error("Failed to copy full content:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-5">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <FileText className="h-5 w-5 text-indigo-500 absolute" />
        </div>
        <div className="text-center space-y-2 max-w-sm px-4">
          <p className="text-base font-bold text-slate-800">Generating Document Architecture...</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Parsing source abstract syntax trees, compiling route registries, and building production-ready Markdown specifications.
          </p>
        </div>
      </div>
    );
  }

  if (isError || !docs) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <div className="h-14 w-14 rounded-2xl bg-rose-550/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-rose-600" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Failed to Compile Documentation</h3>
        <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
          DevDoc AI was unable to parse the scanning files of this codebase. Ensure your endpoints are structured cleanly and try rebuilding.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to={id ? `/projects/${id}/analysis` : "/dashboard"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 transition-all cursor-pointer"
          >
            <span>Retry Compiling</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}/analysis`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-550 to-violet-650 shadow-md shadow-indigo-100">
                <Terminal className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                DevDoc<span className="text-indigo-600">.AI</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono">
              {user?.email}
            </span>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dashboard Space */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 space-y-6">
        
        {/* Breadcrumb Navigation & Top Summary Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-6">
          <div className="space-y-1">
            <nav className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">
              <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Projects</Link>
              <span>/</span>
              <Link to={`/projects/${id}`} className="hover:text-indigo-600 transition-colors truncate max-w-[120px]">
                {project?.name || "Project"}
              </Link>
              <span>/</span>
              <span className="text-slate-700">Preview</span>
            </nav>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Documentation Workspace
              <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            </h1>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFull}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              {copiedFull ? (
                <>
                  <Check className="h-4 w-4 text-emerald-500 animate-bounce" />
                  <span>Copied Entire Code!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-450" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              id="btn-download-active-doc"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-550 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download {activeTab === "readme" ? "README.md" : "API.md"}</span>
            </button>
          </div>
        </div>

        {/* 12-Column Responsive Board Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Column 1: Left Navigation & File Selector (3 Columns) */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm space-y-1.5">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono px-2 mb-2.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                Select Output File
              </h3>
              
              <button
                id="tab-readme"
                onClick={() => {
                  setActiveTab("readme");
                  setViewMode("preview");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === "readme"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">README.md Overview</span>
                </div>
                {activeTab === "readme" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                )}
              </button>

              <button
                id="tab-api"
                onClick={() => {
                  setActiveTab("api");
                  setViewMode("preview");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === "api"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-transparent text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCode className="h-4 w-4 shrink-0" />
                  <span className="truncate">API.md Route Specifications</span>
                </div>
                {activeTab === "api" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                )}
              </button>
            </div>

            {/* Micro Metadata Panel */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-mono">Engine Status: Ready</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Documentation was generated cleanly using automated abstract syntax analysis.
              </p>
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Encoding</span>
                  <span className="font-mono font-bold text-slate-700">UTF-8</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Structure</span>
                  <span className="font-mono font-bold text-slate-700">ISO Markdown</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Center Primary Viewport (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* View Mode Controller */}
            <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "preview"
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-transparent text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Rendered Document</span>
                </button>

                <button
                  onClick={() => setViewMode("raw")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "raw"
                      ? "bg-indigo-50 text-indigo-700"
                      : "bg-transparent text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Raw Markdown Source</span>
                </button>
              </div>

              <div className="text-[10px] font-mono font-bold text-indigo-500 pr-3.5">
                {activeTab === "readme" ? "README.md" : "API.md"}
              </div>
            </div>

            {/* Viewport Render Block */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-550 to-violet-650"></div>
              
              <div className="p-6 sm:p-10">
                <AnimatePresence mode="wait">
                  {viewMode === "preview" ? (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="markdown-body select-text text-slate-800"
                    >
                      <ReactMarkdown components={MarkdownComponents}>
                        {activeContent}
                      </ReactMarkdown>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="raw"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="font-mono text-xs leading-relaxed text-slate-800"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-slate-400">
                        <span>Markdown Source Editor File</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">ReadOnly</span>
                      </div>
                      <pre className="overflow-x-auto whitespace-pre-wrap select-all bg-slate-50 border border-slate-200 p-5 rounded-xl font-mono text-[11px] text-slate-700 max-h-[800px] overflow-y-auto">
                        {activeContent}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

          {/* Column 3: Right Sidebar Sticky Outline / TOC (3 Columns) */}
          <div className="lg:col-span-3 hidden lg:block sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Layout className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                  Document Outline
                </h3>
              </div>

              {toc.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No structured sections detected in this file.</p>
              ) : (
                <nav className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                  {toc.map((header, idx) => (
                    <a
                      key={`${header.id}-${idx}`}
                      href={`#${header.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(header.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`block text-xs font-medium text-slate-500 hover:text-indigo-600 hover:translate-x-0.5 transition-all ${
                        header.level === 1
                          ? "text-slate-800 font-bold"
                          : header.level === 2
                          ? "pl-3 border-l border-slate-150 py-0.5"
                          : "pl-6 text-slate-450 text-[11px] border-l border-slate-100 py-0.5"
                      }`}
                    >
                      {header.text}
                    </a>
                  ))}
                </nav>
              )}

              <div className="border-t border-slate-100 pt-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pro-Tip</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Click on any header outline item above to scroll smoothly to that section of your documentation.
                </p>
              </div>
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
