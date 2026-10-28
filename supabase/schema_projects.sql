-- ==============================================================
-- Schema Supabase: Projects & Kanban Tasks (CodeByMiguel Workspace)
-- ==============================================================

-- 1. Table: projects (dengan field lengkap: kategori, deadline, status, repo link, deskripsi, tech stack)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Web Development',
  category TEXT DEFAULT 'Web Development',
  progress INTEGER NOT NULL DEFAULT 0,
  deadline TEXT NOT NULL DEFAULT '2026-11-20',
  status TEXT NOT NULL DEFAULT 'In Progress' CHECK (status IN ('In Progress', 'On Hold', 'Completed')),
  repo_link TEXT,
  description TEXT,
  technologies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jalankan jika tabel projects sudah pernah dibuat sebelumnya (menambahkan kolom baru):
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Web Development',
  ADD COLUMN IF NOT EXISTS repo_link TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS technologies TEXT[] DEFAULT '{}';

-- Index user_email untuk query cepat per akun
CREATE INDEX IF NOT EXISTS idx_projects_user_email ON public.projects(user_email);

-- 2. Table: project_tasks (Kanban cards)
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'progress', 'pending', 'done')),
  date TEXT NOT NULL DEFAULT '24 Jul',
  tag TEXT NOT NULL DEFAULT 'Mobile',
  tag_color TEXT NOT NULL DEFAULT 'blue',
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index project_id dan user_email
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user_email ON public.project_tasks(user_email);

-- 3. Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Memungkinkan akses aman berbasis user)
CREATE POLICY "Allow all operations for projects" ON public.projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for project_tasks" ON public.project_tasks
  FOR ALL USING (true) WITH CHECK (true);
