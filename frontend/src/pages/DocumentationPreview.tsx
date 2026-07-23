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
  Copy,
  Check,
  Layout,
  Code,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Share2
} from "lucide-react";

type DocType = "readme" | "api";
type ViewMode = "preview" | "raw";

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
};

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
    <div className="relative my-6 border border-slate-800 rounded-xl overflow-hidden shadow-xl bg-[#07090e] font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
        <span className="uppercase text-[10px] font-bold tracking-widest text-cyan-400">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] hover:text-white hover:bg-slate-800 transition-all cursor-pointer bg-slate-950 border border-slate-800"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy Code</span>
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

const MarkdownComponents = {
  h1: ({ children }: any) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugify(text);
    return (
      <h1 id={id} className="text-2xl sm:text-3xl font-extrabold border-b border-slate-800 pb-3 mt-8 mb-4 text-white tracking-tight scroll-mt-24 font-mono">
        {children}
      </h1>
    );
  },
  h2: ({ children }: any) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugify(text);
    return (
      <h2 id={id} className="text-xl font-bold mt-8 mb-3.5 text-cyan-300 tracking-tight flex items-center gap-2 scroll-mt-24 border-b border-slate-800/80 pb-2">
        {children}
      </h2>
    );
  },
  h3: ({ children }: any) => {
    const text = typeof children === "string" ? children : React.Children.toArray(children).join("");
    const id = slugify(text);
    return (
      <h3 id={id} className="text-lg font-bold mt-6 mb-2 text-slate-200 tracking-tight scroll-mt-24">
        {children}
      </h3>
    );
  },
  p: ({ children }: any) => (
    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
      {children}
    </p>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc pl-5 mb-5 text-xs sm:text-sm text-slate-300 space-y-1.5">
      {children}
    </ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal pl-5 mb-5 text-xs sm:text-sm text-slate-300 space-y-1.5">
      {children}
    </ol>
  ),
  li: ({ children }: any) => (
    <li className="text-xs sm:text-sm text-slate-300 leading-relaxed">
      {children}
    </li>
  ),
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-6 border border-slate-800 rounded-xl shadow-lg bg-slate-900/60">
      <table className="min-w-full divide-y divide-slate-800 text-left text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-slate-950 font-mono text-[11px] uppercase text-cyan-400 font-bold tracking-wider">
      {children}
    </thead>
  ),
  tbody: ({ children }: any) => (
    <tbody className="divide-y divide-slate-800/80 bg-slate-900/40">
      {children}
    </tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-800/40 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 font-bold">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 text-slate-300 font-mono">
      {children}
    </td>
  ),
  code: ({ node, inline, className, children, ...props }: any) => {
    return inline ? (
      <code 
        className="bg-cyan-950 text-cyan-300 font-mono text-[11px] px-1.5 py-0.5 rounded-md font-semibold border border-cyan-800/50" 
        {...props}
      >
        {children}
      </code>
    ) : (
      <CodeBlock className={className}>{children}</CodeBlock>
    );
  },
  hr: () => <hr className="my-8 border-slate-800" />,
  strong: ({ children }: any) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-slate-300">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-cyan-500 pl-4 italic text-slate-400 my-5 bg-cyan-950/20 py-3 pr-3 rounded-r-xl">
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

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("No project ID");
      const res = await projectsApi.getOne(id);
      return res.data?.project;
    },
    enabled: !!id,
  });

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

  const toc = useMemo(() => {
    if (!activeContent) return [];
    const lines = activeContent.split("\n");
    const headers: { id: string; text: string; level: number }[] = [];
    
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].replace(/[_*`]/g, "").trim();
        const id = slugify(text);
        headers.push({ id, text, level });
      }
    });
    return headers;
  }, [activeContent]);

  const handleDownload = async (format: 'readme' | 'api' | 'openapi' | 'postman') => {
    if (!id) return;
    try {
      setDownloading(true);
      if (format === "readme") {
        await documentationApi.downloadReadme(id);
      } else if (format === "api") {
        await documentationApi.downloadApi(id);
      } else if (format === "openapi") {
        window.open(`/api/projects/${id}/documentation/download/openapi`, '_blank');
      } else if (format === "postman") {
        window.open(`/api/projects/${id}/documentation/download/postman`, '_blank');
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
      <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center gap-5 text-slate-100">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
        <div className="text-center space-y-2 max-w-sm px-4">
          <p className="text-sm font-bold font-mono">Parsing Codebase AST & Compiling Documentation Specs...</p>
        </div>
      </div>
    );
  }

  if (isError || !docs) {
    return (
      <div className="min-h-screen bg-[#07090e] flex flex-col justify-center items-center p-6 text-center text-slate-100">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 border border-rose-500/30">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold">Failed to Compile Documentation</h3>
        <div className="mt-6 flex items-center gap-3">
          <Link
            to={id ? `/projects/${id}/analysis` : "/dashboard"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-all cursor-pointer"
          >
            <span>Retry Compiling</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to={`/projects/${id}/analysis`}
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
              className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 transition-all"
            >
              Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 sm:px-8 space-y-6">
        
        {/* Top Header & Export Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <nav className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Projects</Link>
              <span>/</span>
              <Link to={`/projects/${id}`} className="hover:text-cyan-400 transition-colors truncate max-w-[120px]">
                {project?.name || "Project"}
              </Link>
              <span>/</span>
              <span className="text-slate-300">Documentation</span>
            </nav>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 font-mono">
              API Documentation & Specifications
            </h1>
          </div>

          {/* Export Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleDownload('openapi')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>OpenAPI 3.1 Spec</span>
            </button>

            <button
              onClick={() => handleDownload('postman')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Postman Collection</span>
            </button>

            <button
              onClick={handleCopyFull}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-all cursor-pointer"
            >
              {copiedFull ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleDownload(activeTab)}
              disabled={downloading}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{activeTab === 'readme' ? 'README.md' : 'API.md'}</span>
            </button>
          </div>
        </div>

        {/* Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column File Picker */}
          <div className="lg:col-span-3 space-y-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono px-2 mb-2">
                Documentation Files
              </h3>
              
              <button
                onClick={() => {
                  setActiveTab("readme");
                  setViewMode("preview");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "readme"
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                    : "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span>README.md Overview</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab("api");
                  setViewMode("preview");
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "api"
                    ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20"
                    : "bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="h-4 w-4 shrink-0" />
                  <span>API.md Endpoints</span>
                </div>
              </button>
            </div>
          </div>

          {/* Center Column Content */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setViewMode("preview")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "preview"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => setViewMode("raw")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === "raw"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      : "bg-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Raw Markdown</span>
                </button>
              </div>

              <div className="text-[10px] font-mono font-bold text-cyan-400 pr-3">
                {activeTab === "readme" ? "README.md" : "API.md"}
              </div>
            </div>

            {/* Document Render Body */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {viewMode === "preview" ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="select-text text-slate-300"
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
                    className="font-mono text-xs text-slate-300"
                  >
                    <pre className="overflow-x-auto whitespace-pre-wrap select-all bg-[#07090e] border border-slate-800 p-4 rounded-xl font-mono text-[11px] text-slate-300 max-h-[700px] overflow-y-auto">
                      {activeContent}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Outline Sidebar */}
          <div className="lg:col-span-3 hidden lg:block sticky top-24">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layout className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Document Outline
                </h3>
              </div>

              {toc.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No structured sections found.</p>
              ) : (
                <nav className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {toc.map((header, idx) => (
                    <a
                      key={`${header.id}-${idx}`}
                      href={`#${header.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(header.id)?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className={`block text-xs font-medium text-slate-400 hover:text-cyan-400 transition-all ${
                        header.level === 1
                          ? "text-white font-bold"
                          : "pl-3 text-slate-400 border-l border-slate-800"
                      }`}
                    >
                      {header.text}
                    </a>
                  ))}
                </nav>
              )}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
