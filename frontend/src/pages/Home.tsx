import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Terminal, Sparkles, ArrowRight, Zap, Code2, Layers, Download, CheckCircle2, Play } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);

  const handleLaunchDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await axios.post('/api/projects/demo');
      const project = res.data?.data?.project;
      if (project && project.id) {
        navigate(`/projects/${project.id}`);
      } else {
        navigate('/dashboard');
      }
    } catch {
      navigate('/dashboard');
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#07090e] text-slate-100 flex flex-col overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Dynamic Background Gradients & Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293d0d_1px,transparent_1px),linear-gradient(to_bottom,#1f293d0d_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#07090e]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
              <Terminal className="h-5 w-5 text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-mono">
              DevDoc<span className="text-cyan-400">.AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleLaunchDemo}
              disabled={loadingDemo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all shadow-sm"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{loadingDemo ? 'Launching Demo...' : '1-Click Live Demo'}</span>
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 hover:bg-cyan-300 transition-all"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-all border border-slate-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center py-16 sm:py-24 relative z-10">
        <div className="mx-auto max-w-5xl px-6 sm:px-8 text-center flex flex-col items-center">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-md"
          >
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>Deterministic AST Codebase Analysis • V1 Core Engine</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-4xl font-extrabold tracking-tight text-white sm:text-6xl max-w-4xl"
          >
            Instant API Documentation & Specs for <br />
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Backend Engineers
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-sm sm:text-base leading-relaxed text-slate-400"
          >
            Upload your Node, Express, Python, or Spring Boot ZIP file. DevDoc AI parses routes, parameters, and schemas in milliseconds to output 100% accurate OpenAPI 3.1, Postman collections, and interactive portals.
          </motion.p>

          {/* Call to Actions */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center"
          >
            <button 
              onClick={handleLaunchDemo}
              disabled={loadingDemo}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-xl shadow-cyan-400/20 hover:bg-cyan-300 transition-all cursor-pointer"
            >
              <Play className="h-4 w-4 fill-slate-950" />
              <span>{loadingDemo ? 'Launching Demo...' : 'Explore Interactive Demo'}</span>
            </button>

            {isAuthenticated ? (
              <Link 
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all"
              >
                <span>Upload Codebase</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link 
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-all"
              >
                <span>Sign Up Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </motion.div>

          {/* Feature Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl text-left"
          >
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">AST Route & Schema Parser</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Zero-latency local AST parser extracts path parameters, validation schemas (Zod/Pydantic), and controller handlers accurately.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 mb-4 border border-cyan-500/20">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">OpenAPI 3.1 & Postman Spec Export</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Export standard OpenAPI 3.1 JSON/YAML specs and Postman collections ready for immediate team import.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 backdrop-blur-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-4 border border-purple-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Interactive Sandbox & Code Generator</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Test endpoints directly in-browser with header authentication and generate copy-pasteable client code (cURL, Python, Go, JS).
              </p>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090e] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DevDoc AI. Built for Backend Engineers.</p>
          <div className="flex gap-4 font-mono">
            <span className="text-slate-400">OpenAPI 3.1</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Postman v2.1</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">AST Analysis</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
