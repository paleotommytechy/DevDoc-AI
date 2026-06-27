import React, { useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { 
  ArrowLeft, 
  Terminal, 
  Folder, 
  Edit3, 
  Trash2, 
  Upload, 
  AlertCircle, 
  Calendar, 
  Loader2, 
  X, 
  Check, 
  Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!id) return;
      const res = await projectsApi.uploadCodebase(id, file);
      if (!res.success) {
        throw new Error(res.message || "Codebase analysis failed.");
      }
      return res.data?.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedFile(null);
      navigate(`/projects/${id}/analysis`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to upload or analyze codebase.");
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".zip")) {
        setSelectedFile(file);
        setErrorMsg(null);
      } else {
        setErrorMsg("Only .zip archives are supported for scanning.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.endsWith(".zip")) {
        setSelectedFile(file);
        setErrorMsg(null);
      } else {
        setErrorMsg("Only .zip archives are supported for scanning.");
      }
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) return;
    uploadMutation.mutate(selectedFile);
  };

  // 1. Fetch single project
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

  // 2. Edit project mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { name: string; description: string | null }) => {
      if (!id) return;
      const res = await projectsApi.update(id, updates);
      if (!res.success) {
        throw new Error(res.message || "Failed to update project");
      }
      return res.data?.project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsEditing(false);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Something went wrong.");
    }
  });

  // 3. Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const res = await projectsApi.delete(id);
      if (!res.success) {
        throw new Error(res.message || "Failed to delete project");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/dashboard");
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to delete project.");
    }
  });

  const handleStartEdit = () => {
    if (project) {
      setEditName(project.name);
      setEditDesc(project.description || "");
      setErrorMsg(null);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setErrorMsg("Project name is required");
      return;
    }
    updateMutation.mutate({
      name: editName,
      description: editDesc.trim() || null,
    });
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this project? This action is irreversible.")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center gap-4">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading project details...</p>
      </div>
    );
  }

  if (uploadMutation.isPending) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="relative flex items-center justify-center mb-8">
          <span className="absolute inline-flex h-20 w-20 rounded-full bg-indigo-500 opacity-20 animate-ping"></span>
          <div className="h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex shadow-lg shadow-indigo-500/30">
            <Terminal className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        <h3 className="text-2xl font-bold tracking-tight">Analyzing Project...</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-sm leading-relaxed">
          DevDoc AI is parsing your codebase, discovering API routes, counting controllers, models, and identifying technologies.
        </p>
        <div className="mt-8 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-750 text-xs text-indigo-400 font-mono">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>AST TOKENIZATION IN PROGRESS...</span>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900">Project Not Found</h3>
        <p className="mt-2 text-sm text-slate-600 max-w-md">
          This project may have been deleted, or you don't have access to it.
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
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
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
          <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 truncate max-w-[180px]">{project.name}</span>
        </nav>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800 font-medium">{errorMsg}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT SIDE: Project details & Edit Panel */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs relative overflow-hidden">
              {/* Top border line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 mb-3 font-mono">
                          STATUS: {project.status}
                        </span>
                        <h2 className="text-2xl font-bold text-slate-950 tracking-tight sm:text-3xl">
                          {project.name}
                        </h2>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={handleStartEdit}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-xs"
                        >
                          <Edit3 className="h-4 w-4 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 transition-all shadow-xs"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-slate max-w-none">
                      <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {project.description || "No project description provided. Tap 'Edit' to add details."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-slate-100 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Created: {new Date(project.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Last Updated: {new Date(project.updated_at).toLocaleString()}</span>
                      </div>
                    </div>

                  </motion.div>
                ) : (
                  <motion.form
                    key="edit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSaveEdit}
                    className="space-y-4"
                  >
                    <h3 className="text-lg font-bold text-slate-950">Edit Project</h3>
                    
                    <div>
                      <label htmlFor="edit-name" className="block text-sm font-semibold text-slate-700">
                        Project Name
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:outline-hidden focus:ring-indigo-500"
                        placeholder="Project Name"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-desc" className="block text-sm font-semibold text-slate-700">
                        Description
                      </label>
                      <textarea
                        id="edit-desc"
                        rows={4}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="mt-2 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:outline-hidden focus:ring-indigo-500 resize-none"
                        placeholder="Add project details..."
                      />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {updateMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Simulated Documentation Preview area */}
            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs font-mono text-slate-500">swagger-preview.yaml</div>
                <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  Read Only
                </span>
              </div>
              <div className="font-mono text-xs text-slate-400 space-y-1 overflow-x-auto py-2">
                <div>openapi: <span className="text-emerald-400">3.0.0</span></div>
                <div>info:</div>
                <div className="pl-4">title: <span className="text-emerald-400">{project.name}</span></div>
                <div className="pl-4">version: <span className="text-emerald-400">1.0.0</span></div>
                <div>paths: <span className="text-slate-600">&#123;&#125;</span></div>
                <div className="text-slate-600 pt-3 select-none">// Connect files on the right to start code analyses...</div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: Upload section (Unlocked & Fully Functional) */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs relative overflow-hidden">
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Upload className="h-5.5 w-5.5" />
                  </div>
                  {project.analysis_status === "Completed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/10 font-mono">
                      <Check className="h-3.5 w-3.5" />
                      <span>ANALYZED</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 font-mono">
                      <span>READY</span>
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Upload Codebase
                  </h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Upload your backend .zip archive here to trigger automatic intelligent parsing and API discovery.
                  </p>
                </div>

                {/* File Drop/Click Zone */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".zip"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer flex flex-col items-center justify-center gap-3 transition-all ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-50/50 animate-pulse"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <Upload className={`h-8 w-8 transition-colors ${dragOver ? "text-indigo-600" : "text-slate-400"}`} />
                  
                  {selectedFile ? (
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm text-slate-600 font-semibold">
                        Drag zip here, or click to browse
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Supports .zip archives up to 50MB</span>
                    </>
                  )}
                </div>

                {selectedFile && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleUploadSubmit}
                      className="flex-1 flex justify-center items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all cursor-pointer"
                    >
                      <span>Parse Codebase</span>
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer flex items-center justify-center"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* View Latest Discovery card if project is analyzed */}
                {project.analysis_status === "Completed" && (
                  <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4 space-y-3">
                    <div className="text-xs text-indigo-950 font-medium leading-relaxed">
                      This project has been analyzed successfully. You can view the full interactive dashboard including endpoints, controllers, models, and technologies.
                    </div>
                    <Link
                      to={`/projects/${project.id}/analysis`}
                      className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <span>View Project Discovery</span>
                    </Link>
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
