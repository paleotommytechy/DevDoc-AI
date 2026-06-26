import React from 'react';
import { 
  FileJson, 
  Sparkles, 
  Terminal, 
  ArrowRight, 
  BookOpen, 
  Cpu, 
  Code2, 
  Layers,
  ExternalLink,
  Github
} from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  return (
    <div id="app-root" class="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header / Navbar */}
      <header id="app-header" class="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div class="flex items-center gap-2.5">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-100">
              <Terminal class="h-5.5 w-5.5 text-white" />
            </div>
            <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 bg-clip-text text-transparent">
              DevDoc AI
            </span>
          </div>

          <nav class="flex items-center gap-6">
            <span class="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              Phase 0: Project Initialized
            </span>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main id="main-content" class="flex-1 flex flex-col justify-center items-center relative overflow-hidden py-16 sm:py-24">
        
        {/* Subtle Decorative Background Gradients */}
        <div class="absolute inset-0 -z-10 flex items-center justify-center">
          <div class="h-[400px] w-[600px] rounded-full bg-indigo-100/40 blur-3xl filter"></div>
          <div class="h-[300px] w-[500px] translate-x-20 rounded-full bg-violet-100/30 blur-3xl filter"></div>
        </div>

        <div class="mx-auto max-w-5xl px-6 sm:px-8 text-center flex flex-col items-center">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            class="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/50 px-4 py-1.5 text-sm font-medium text-indigo-800 backdrop-blur-sm"
          >
            <Sparkles class="h-4 w-4 text-indigo-600 animate-pulse" />
            <span>AI-Powered API Documentation</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            class="mt-8 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl"
          >
            Automate Your Backend API <br />
            <span class="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Documentation in Seconds
            </span>
          </motion.h1>

          {/* Subtitle / Description */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            class="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
          >
            DevDoc AI analyzes your backend codebase, parses routes, and automatically generates comprehensive, beautiful, and developer-friendly documentation using artificial intelligence.
          </motion.p>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            class="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <button 
              type="button"
              class="relative inline-flex items-center gap-2.5 rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all cursor-not-allowed group"
            >
              <span>Coming Soon</span>
              <ArrowRight class="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all"
            >
              <Github class="h-5 w-5 text-slate-500" />
              <span>GitHub</span>
            </a>
          </motion.div>

          {/* Visual Interactive Preview Cards Section (The Craftsmanship Touch) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            class="mt-16 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-200/50"
          >
            <div class="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
              {/* Fake Window Header */}
              <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                <div class="flex items-center gap-2">
                  <div class="h-3 w-3 rounded-full bg-slate-200"></div>
                  <div class="h-3 w-3 rounded-full bg-slate-200"></div>
                  <div class="h-3 w-3 rounded-full bg-slate-200"></div>
                </div>
                <div class="text-xs font-mono text-slate-400 tracking-wide">devdoc-dashboard-preview</div>
                <div class="w-12"></div>
              </div>

              {/* Fake Dashboard Grid */}
              <div class="grid grid-cols-1 md:grid-cols-2 p-6 gap-6 text-left">
                {/* Left side: Code Parsing */}
                <div class="rounded-lg border border-slate-200/80 bg-white p-5 flex flex-col h-full shadow-sm">
                  <div class="flex items-center gap-2 text-indigo-600 mb-3">
                    <Code2 class="h-5 w-5" />
                    <span class="font-bold text-sm tracking-tight text-slate-800">Source Repository Analysis</span>
                  </div>
                  <p class="text-xs text-slate-500 mb-4">
                    Connect your Express, Fastify, or Django backend. DevDoc AI parses routes, schemas, and docstrings.
                  </p>
                  <div class="flex-1 font-mono text-[11px] leading-relaxed text-slate-700 p-3 rounded bg-slate-50 border border-slate-100/50 overflow-x-auto select-none">
                    <span class="text-violet-600">const</span> app = express();<br />
                    app.get(<span class="text-emerald-600">"/api/users/:id"</span>, <span class="text-amber-600">getUser</span>);<br />
                    <span class="text-slate-400">// Automatically extracts path parameters...</span>
                  </div>
                </div>

                {/* Right side: AI Generated Documentation */}
                <div class="rounded-lg border border-slate-200/80 bg-white p-5 flex flex-col h-full shadow-sm">
                  <div class="flex items-center gap-2 text-emerald-600 mb-3">
                    <Layers class="h-5 w-5" />
                    <span class="font-bold text-sm tracking-tight text-slate-800">API Documentation Generated</span>
                  </div>
                  <p class="text-xs text-slate-500 mb-4">
                    Instantly outputs OpenAPI / Swagger schemas, beautifully styled developer portals, and interactive playground forms.
                  </p>
                  <div class="flex-1 flex flex-col gap-2 p-3 rounded bg-slate-50 border border-slate-100/50">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/10">GET</span>
                      <span class="font-mono text-xs text-slate-700 font-semibold">/api/users/&#123;id&#125;</span>
                    </div>
                    <div class="h-px bg-slate-200/80 my-1"></div>
                    <div class="flex flex-col gap-1">
                      <div class="h-2 w-24 rounded bg-slate-200"></div>
                      <div class="h-1.5 w-full rounded bg-slate-200/60"></div>
                      <div class="h-1.5 w-3/4 rounded bg-slate-200/60"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer id="app-footer" class="border-t border-slate-200/80 bg-white py-8 text-center text-sm text-slate-500">
        <div class="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DevDoc AI. All rights reserved.</p>
          <div class="flex gap-4">
            <span class="text-slate-400 hover:text-slate-600 cursor-not-allowed">Terms</span>
            <span class="text-slate-400 hover:text-slate-600 cursor-not-allowed">Privacy</span>
            <span class="text-slate-400 hover:text-slate-600 cursor-not-allowed">Docs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
