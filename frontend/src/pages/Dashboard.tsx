import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../context/AuthContext";
import { projectsApi } from "../services/api";
import { 
  Terminal, 
  Plus, 
  Folder, 
  Calendar, 
  ArrowRight, 
  LogOut, 
  Loader2, 
  X, 
  AlertCircle, 
  FolderOpen,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Project creation schema
const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").trim(),
  description: z.string().optional(),
});

type CreateProjectFields = z.infer<typeof createProjectSchema>;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 1. Fetch user's projects
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await projectsApi.getAll();
      return res.data?.projects || [];
    },
  });

  // 2. React Hook Form for Project creation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFields>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // 3. Create project mutation
  const createMutation = useMutation({
    mutationFn: async (formData: CreateProjectFields) => {
      const res = await projectsApi.create(formData.name, formData.description || null);
      if (!res.success) {
        throw new Error(res.message || "Failed to create project");
      }
      return res.data?.project;
    },
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setIsModalOpen(false);
      reset();
      if (newProject?.id) {
        navigate(`/projects/${newProject.id}`);
      }
    },
    onError: (err: any) => {
      setCreateError(err.message || "Something went wrong.");
    },
  });

  const onSubmit = (formData: CreateProjectFields) => {
    setCreateError(null);
    createMutation.mutate(formData);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-100">
                <Terminal className="h-5.5 w-5.5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-900 to-indigo-700 bg-clip-text text-transparent">
                DevDoc AI
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-sm font-semibold text-slate-900">{user?.email}</span>
              <span className="text-xs text-slate-500 font-mono">UID: {user?.id?.slice(0, 8)}...</span>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-10 sm:px-8">
        
        {/* Welcome Block */}
        <div className="md:flex md:items-center md:justify-between border-b border-slate-200 pb-6 mb-8">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Workspace Projects
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Create and manage your projects to automatically generate backend API documentation.
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4 flex shrink-0">
            <button
              onClick={() => {
                setCreateError(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/15 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Loading your projects...</p>
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 max-w-2xl mx-auto my-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900">Failed to load projects</h3>
            <p className="mt-2 text-sm text-red-800 font-medium">{(error as Error)?.message || "Verify your connection or authentication."}</p>
          </div>
        )}

        {/* Project List / Empty state */}
        {!isLoading && !isError && (
          <>
            {data && data.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.map((proj) => (
                  <motion.div
                    key={proj.id}
                    whileHover={{ y: -3, scale: 1.01 }}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
                  >
                    {/* Subtle status indicator bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <Folder className="h-5.5 w-5.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          {proj.source_type && (
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset font-mono ${
                              proj.source_type === "ZIP"
                                ? "bg-slate-50 text-slate-600 ring-slate-500/10"
                                : proj.source_type === "LOCAL_URL" || proj.source_type === "LOCAL"
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-600/10"
                                : "bg-purple-50 text-purple-700 ring-purple-600/10"
                            }`}>
                              {proj.source_type === "ZIP" ? "ZIP" : (proj.source_type === "LOCAL_URL" || proj.source_type === "LOCAL") ? "LOCAL" : "PUBLIC"}
                            </span>
                          )}
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 font-mono">
                            {proj.status}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {proj.name}
                      </h3>
                      
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2 min-h-[2.5rem]">
                        {proj.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(proj.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <Link
                        to={`/projects/${proj.id}`}
                        className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                      >
                        <span>Open</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-6 max-w-xl mx-auto shadow-sm">
                <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Create your first project to explore, parse, and document your APIs.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Project</span>
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* Slide-over or Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            ></motion.div>

            {/* Modal Body Wrapper */}
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg p-6 border border-slate-100"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold text-slate-950 tracking-tight">
                    Create New Project
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
                  
                  {/* Validation or Mutation Error */}
                  {createError && (
                    <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800 font-medium">{createError}</div>
                    </div>
                  )}

                  {/* Project Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                      Project Name *
                    </label>
                    <input
                      {...register("name")}
                      id="name"
                      type="text"
                      placeholder="My Backend API"
                      className={`mt-2 block w-full px-4 py-3 border rounded-xl text-sm transition-all bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:outline-hidden ${
                        errors.name 
                          ? "border-red-300 focus:ring-red-500" 
                          : "border-slate-200 focus:ring-indigo-500"
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1.5 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Project Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
                      Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      {...register("description")}
                      id="description"
                      rows={3}
                      placeholder="API documentation for our main mobile app..."
                      className="mt-2 block w-full px-4 py-3 border border-slate-200 rounded-xl text-sm transition-all bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:ring-2 focus:ring-offset-0 focus:outline-hidden focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 hover:bg-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Project</span>
                      )}
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
