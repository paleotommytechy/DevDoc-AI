import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Terminal, Sparkles, ArrowRight, Code2, Layers, Github } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-100">
              <Terminal className="h-5.5 w-5.5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 bg-clip-text text-transparent">
              DevDoc AI
            </span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold leading-6 text-slate-700 hover:text-slate-950 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 sm:py-24 relative z-10">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 text-center flex flex-col items-center">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 text-sm font-medium text-indigo-800 backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
            <span>AI-Powered API Documentation</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl"
          >
            Automate Your Backend API <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Documentation in Seconds
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
          >
            DevDoc AI analyzes your backend codebase, parses routes, and automatically generates comprehensive, beautiful, and developer-friendly documentation using artificial intelligence.
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            {isAuthenticated ? (
              <Link 
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/10 hover:bg-indigo-500 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link 
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/10 hover:bg-indigo-500 transition-all"
              >
                <span>Get Started For Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            <button 
              type="button"
              className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-400 shadow-sm cursor-not-allowed"
            >
              <span>Coming Soon</span>
            </button>
          </motion.div>

          {/* Visual Showcase */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/50"
          >
            <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                  <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                  <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                </div>
                <div className="text-xs font-mono text-slate-400 tracking-wide">devdoc-dashboard-preview</div>
                <div className="w-12"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 p-6 gap-6 text-left">
                <div className="rounded-lg border border-slate-200/80 bg-white p-5 flex flex-col h-full shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600 mb-3">
                    <Code2 className="h-5 w-5" />
                    <span className="font-bold text-sm tracking-tight text-slate-800">Source Repository Analysis</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Connect your Express, Fastify, or Django backend. DevDoc AI parses routes, schemas, and docstrings.
                  </p>
                  <div className="flex-1 font-mono text-[11px] leading-relaxed text-slate-700 p-3 rounded bg-slate-50 border border-slate-100/50 overflow-x-auto select-none">
                    <span className="text-violet-600">const</span> app = express();<br />
                    app.get(<span className="text-emerald-600">"/api/users/:id"</span>, <span className="text-amber-600">getUser</span>);<br />
                    <span className="text-slate-400">// Automatically extracts path parameters...</span>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200/80 bg-white p-5 flex flex-col h-full shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-3">
                    <Layers className="h-5 w-5" />
                    <span className="font-bold text-sm tracking-tight text-slate-800">API Documentation Generated</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    Instantly outputs OpenAPI / Swagger schemas, beautifully styled developer portals, and interactive playground forms.
                  </p>
                  <div className="flex-1 flex flex-col gap-2 p-3 rounded bg-slate-50 border border-slate-100/50">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">GET</span>
                      <span className="font-mono text-xs text-slate-700 font-semibold">/api/users/&#123;id&#125;</span>
                    </div>
                    <div className="h-px bg-slate-200/80 my-1"></div>
                    <div class="flex flex-col gap-1">
                      <div className="h-2 w-24 rounded bg-slate-200"></div>
                      <div className="h-1.5 w-full rounded bg-slate-200/60"></div>
                      <div className="h-1.5 w-3/4 rounded bg-slate-200/60"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DevDoc AI. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-slate-400 hover:text-slate-600 cursor-not-allowed">Terms</span>
            <span className="text-slate-400 hover:text-slate-600 cursor-not-allowed">Privacy</span>
            <span className="text-slate-400 hover:text-slate-600 cursor-not-allowed">Docs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
