'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthProvider';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

/* ─── Clean SVG Icons ────────────────────────────────────────── */
function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MoreVerticalIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

function CalendarIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ArrowLeft({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRight({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ExternalLinkIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function TrashIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function EditIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function KanbanBoardIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="3" />
      <path d="M8 7v10M13 7v6M18 7v9" />
    </svg>
  );
}

function UploadImageIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

/* ─── Client Image Compressor Helper ─────────────────────────── */
function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ─── Helpers: Date Formatter ────────────────────────────────── */
function formatDeadlineDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${monthName} ${y}`;
  }
  return dateStr;
}

/* ─── Types ──────────────────────────────────────────────────── */
export type KanbanColumnType = 'todo' | 'progress' | 'pending' | 'done';
export type ProjectStatus = 'In Progress' | 'On Hold' | 'Completed';
export type ProjectCategory = 'Web Development' | 'Mobile App' | 'Video Editing' | 'UI/UX Design' | 'Lainnya';

export interface KanbanTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: KanbanColumnType;
  date: string;
  tag: string;
  tagColor?: 'blue' | 'green' | 'orange' | 'purple' | 'slate';
  image?: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  department: string; // Kategori
  category?: string;
  progress: number;
  deadline: string; // Format: YYYY-MM-DD
  status: ProjectStatus;
  repo_link?: string;
  description?: string;
  technologies?: string[];
}

const CATEGORIES: ProjectCategory[] = [
  'Web Development',
  'Mobile App',
  'Video Editing',
  'UI/UX Design',
  'Lainnya',
];

const PRESET_TECHNOLOGIES = [
  // Web & Frontend
  'React', 'Next.js', 'Vue.js', 'HTML', 'CSS', 'Javascript', 'TypeScript', 'Tailwind CSS', 'Bootstrap',
  // Backend & Databases
  'Laravel', 'Node.js', 'PHP', 'Python', 'Supabase', 'PostgreSQL', 'MySQL',
  // Mobile
  'Flutter', 'React Native', 'Android', 'iOS',
  // Design & Multimedia
  'Figma', 'Canva', 'Adobe Photoshop', 'Adobe Illustrator', 'Blender',
  // Video Editing
  'Adobe Premiere Pro', 'Capcut', 'After Effects', 'DaVinci Resolve',
  // Tools
  'Git', 'GitHub', 'Docker', 'Vercel',
];

const COLUMNS_CONFIG: Array<{
  id: KanbanColumnType;
  title: string;
  bgClass: string;
  borderClass: string;
  badgeClass: string;
}> = [
  { id: 'todo',     title: 'Todo',     bgClass: 'bg-[#eef6ff]', borderClass: 'border-sky-100/90',    badgeClass: 'bg-sky-100 text-sky-800' },
  { id: 'progress', title: 'Progress', bgClass: 'bg-[#f1f3f7]', borderClass: 'border-zinc-200/80',   badgeClass: 'bg-zinc-200 text-zinc-800' },
  { id: 'pending',  title: 'Pending',  bgClass: 'bg-[#fef7ee]', borderClass: 'border-amber-100/90',  badgeClass: 'bg-amber-100 text-amber-800' },
  { id: 'done',     title: 'Done',     bgClass: 'bg-[#effcf4]', borderClass: 'border-emerald-100/90',badgeClass: 'bg-emerald-100 text-emerald-800' },
];

function getStatusBadgeStyle(status: ProjectStatus) {
  switch (status) {
    case 'Completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'On Hold':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'In Progress':
    default:
      return 'bg-blue-50 text-blue-700 border-blue-200';
  }
}

function getTagBadgeStyle(tagColor?: string) {
  switch (tagColor) {
    case 'green':
      return 'bg-[#10b981] text-white';
    case 'orange':
      return 'bg-[#f59e0b] text-white';
    case 'purple':
      return 'bg-[#8b5cf6] text-white';
    case 'slate':
      return 'bg-[#475569] text-white';
    case 'blue':
    default:
      return 'bg-[#0084ff] text-white';
  }
}

const emptySubscribe = () => () => {};

export default function ProjectsPage() {
  const { user } = useAuth();
  const userKey = user?.email || 'default';
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Selected project (null = show all projects list, string id = show Kanban board)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Real Projects State (Starts Empty — No dummy data)
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Form State: Tambah / Edit Project
  const [projectForm, setProjectForm] = useState<{
    name: string;
    category: ProjectCategory;
    deadline: string;
    status: ProjectStatus;
    repo_link: string;
    description: string;
    technologies: string[];
    customTech: string;
  }>({
    name: '',
    category: 'Web Development',
    deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'In Progress', // Otomatis In Progress saat pertama dibuat
    repo_link: '',
    description: '',
    technologies: ['React', 'Next.js'],
    customTech: '',
  });

  // Kanban Tasks state for current project
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Task Modal state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [targetColumn, setTargetColumn] = useState<KanbanColumnType>('todo');
  const [taskForm, setTaskForm] = useState<{
    title: string;
    description: string;
    date: string;
    tag: string;
    tagColor: 'blue' | 'green' | 'orange' | 'purple' | 'slate';
    image: string;
  }>({
    title: '',
    description: '',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    tag: 'Web',
    tagColor: 'blue',
    image: '',
  });

  // Dragging state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // 1. Check URL query on mount (e.g. ?id=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const qId = urlParams.get('id');
    if (qId) {
      setSelectedProjectId(qId);
    }
  }, []);

  // 2. Load Projects (Supabase first, fallback to LocalStorage)
  useEffect(() => {
    if (!user?.email) return;
    const userEmail = user.email;

    const loadProjectsData = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_email', userEmail)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped: ProjectItem[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            department: d.category || d.department || 'Web Development',
            category: d.category || d.department || 'Web Development',
            progress: Number(d.progress) || 0,
            deadline: d.deadline || '',
            status: (d.status as ProjectStatus) || 'In Progress',
            repo_link: d.repo_link || undefined,
            description: d.description || undefined,
            technologies: Array.isArray(d.technologies) ? d.technologies : [],
          }));
          setProjects(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`codebymiguel_projects_${userKey}`, JSON.stringify(mapped));
          }
          return;
        }
      } catch (e) {
        console.warn('Projects Supabase query fallback:', e);
      }

      // LocalStorage fallback
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(`codebymiguel_projects_${userKey}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setProjects(parsed);
              return;
            }
          }
        } catch {}
      }
      setProjects([]);
    };

    loadProjectsData();
  }, [user?.email, userKey]);

  const saveProjects = async (updated: ProjectItem[]) => {
    setProjects(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`codebymiguel_projects_${userKey}`, JSON.stringify(updated));
      } catch {}
    }
  };

  // 3. Load Tasks for selected project (Supabase first, fallback to LocalStorage)
  useEffect(() => {
    if (!selectedProjectId || !user?.email) {
      setTasks([]);
      return;
    }
    const userEmail = user.email;

    const loadTasksData = async () => {
      try {
        const { data, error } = await supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: true });

        if (!error && data) {
          const mapped: KanbanTask[] = data.map((d: any) => ({
            id: d.id,
            projectId: d.project_id,
            title: d.title,
            description: d.description || undefined,
            status: d.status as KanbanColumnType,
            date: d.date || '24 Jul',
            tag: d.tag || 'Web',
            tagColor: d.tag_color || 'blue',
            image: d.image || undefined,
          }));
          setTasks(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              `codebymiguel_project_tasks_${userKey}_${selectedProjectId}`,
              JSON.stringify(mapped)
            );
          }
          return;
        }
      } catch (e) {
        console.warn('Project tasks Supabase query fallback:', e);
      }

      // LocalStorage fallback
      if (typeof window !== 'undefined') {
        try {
          const savedKey = `codebymiguel_project_tasks_${userKey}_${selectedProjectId}`;
          const saved = localStorage.getItem(savedKey);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              setTasks(parsed);
              return;
            }
          }
        } catch {}
      }

      setTasks([]);
    };

    loadTasksData();
  }, [selectedProjectId, user?.email, userKey]);

  const saveTasks = async (updated: KanbanTask[]) => {
    setTasks(updated);
    if (!selectedProjectId) return;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `codebymiguel_project_tasks_${userKey}_${selectedProjectId}`,
          JSON.stringify(updated)
        );
      } catch {}

      // Auto update project progress based on completed tasks
      const total = updated.length;
      if (total > 0) {
        const done = updated.filter(t => t.status === 'done').length;
        const newProgress = Math.round((done / total) * 100);
        const nextStatus: ProjectStatus = newProgress === 100 ? 'Completed' : 'In Progress';

        const updatedProjects: ProjectItem[] = projects.map(p =>
          p.id === selectedProjectId
            ? {
                ...p,
                progress: newProgress,
                status: (p.status === 'On Hold' ? 'On Hold' : nextStatus) as ProjectStatus,
              }
            : p
        );
        saveProjects(updatedProjects);

        // Sync to Supabase
        try {
          await supabase.from('projects').update({ progress: newProgress, status: nextStatus }).eq('id', selectedProjectId);
        } catch {}
      }
    }
  };

  // Find active project
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Open Modal Tambah Project
  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({
      name: '',
      category: 'Web Development',
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'In Progress', // Otomatis In Progress
      repo_link: '',
      description: '',
      technologies: ['React', 'Next.js'],
      customTech: '',
    });
    setIsAddProjectModalOpen(true);
  };

  // Open Modal Edit Project
  const handleOpenEditProject = (proj: ProjectItem) => {
    setEditingProject(proj);
    setProjectForm({
      name: proj.name,
      category: (proj.category || proj.department || 'Web Development') as ProjectCategory,
      deadline: proj.deadline || new Date().toISOString().split('T')[0],
      status: proj.status || 'In Progress',
      repo_link: proj.repo_link || '',
      description: proj.description || '',
      technologies: proj.technologies || [],
      customTech: '',
    });
    setIsAddProjectModalOpen(true);
  };

  // Toggle teknologi pill selection
  const handleToggleTech = (tech: string) => {
    setProjectForm(prev => {
      const exists = prev.technologies.includes(tech);
      if (exists) {
        return { ...prev, technologies: prev.technologies.filter(t => t !== tech) };
      } else {
        return { ...prev, technologies: [...prev.technologies, tech] };
      }
    });
  };

  // Tambah custom tech
  const handleAddCustomTech = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const val = projectForm.customTech.trim();
    if (!val) return;
    if (!projectForm.technologies.includes(val)) {
      setProjectForm(prev => ({
        ...prev,
        technologies: [...prev.technologies, val],
        customTech: '',
      }));
    } else {
      setProjectForm(prev => ({ ...prev, customTech: '' }));
    }
  };

  // Save Project (Add or Edit)
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.name.trim() || !user?.email) return;
    const userEmail = user.email;

    if (editingProject) {
      // Edit existing
      const updatedItem: ProjectItem = {
        ...editingProject,
        name: projectForm.name.trim(),
        department: projectForm.category,
        category: projectForm.category,
        deadline: projectForm.deadline,
        status: projectForm.status,
        repo_link: projectForm.repo_link.trim() || undefined,
        description: projectForm.description.trim() || undefined,
        technologies: projectForm.technologies,
      };

      const updated = projects.map(p => (p.id === editingProject.id ? updatedItem : p));
      saveProjects(updated);

      try {
        await supabase
          .from('projects')
          .update({
            name: updatedItem.name,
            department: updatedItem.department,
            category: updatedItem.category,
            deadline: updatedItem.deadline,
            status: updatedItem.status,
            repo_link: updatedItem.repo_link || null,
            description: updatedItem.description || null,
            technologies: updatedItem.technologies || [],
          })
          .eq('id', editingProject.id);
      } catch (err) {
        console.warn('Supabase update project fallback:', err);
      }

      toast.success('Project berhasil diperbarui!');
    } else {
      // Create new (Otomatis In Progress)
      const newItem: ProjectItem = {
        id: Date.now().toString(),
        name: projectForm.name.trim(),
        department: projectForm.category,
        category: projectForm.category,
        progress: 0,
        deadline: projectForm.deadline,
        status: 'In Progress', // Otomatis saat baru dibuat
        repo_link: projectForm.repo_link.trim() || undefined,
        description: projectForm.description.trim() || undefined,
        technologies: projectForm.technologies,
      };

      const updated = [newItem, ...projects];
      saveProjects(updated);

      try {
        const { data: inserted } = await supabase
          .from('projects')
          .insert({
            name: newItem.name,
            department: newItem.department,
            category: newItem.category,
            progress: 0,
            deadline: newItem.deadline,
            status: 'In Progress',
            repo_link: newItem.repo_link || null,
            description: newItem.description || null,
            technologies: newItem.technologies || [],
            user_email: userEmail,
          })
          .select('id')
          .single();

        if (inserted?.id) {
          newItem.id = inserted.id;
          saveProjects([newItem, ...projects]);
        }
      } catch (err) {
        console.warn('Supabase insert project fallback:', err);
      }

      toast.success('Project baru berhasil ditambahkan!');
      setSelectedProjectId(newItem.id);
    }

    setIsAddProjectModalOpen(false);
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus project ini beserta seluruh task-nya?')) {
      const updated = projects.filter(p => p.id !== id);
      saveProjects(updated);
      if (selectedProjectId === id) setSelectedProjectId(null);

      if (typeof window !== 'undefined') {
        localStorage.removeItem(`codebymiguel_project_tasks_${userKey}_${id}`);
      }

      try {
        await supabase.from('projects').delete().eq('id', id);
        await supabase.from('project_tasks').delete().eq('project_id', id);
      } catch (err) {
        console.warn('Supabase delete project fallback:', err);
      }

      toast.success('Project berhasil dihapus');
    }
  };

  // Task Move Action
  const handleMoveTask = async (taskId: string, newStatus: KanbanColumnType) => {
    const updated = tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t));
    saveTasks(updated);
    setActiveMenuTaskId(null);

    try {
      await supabase.from('project_tasks').update({ status: newStatus }).eq('id', taskId);
    } catch {}
  };

  // Task Delete
  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    saveTasks(updated);
    setActiveMenuTaskId(null);

    try {
      await supabase.from('project_tasks').delete().eq('id', taskId);
    } catch {}

    toast.success('Task dihapus');
  };

  // Image File Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Harap pilih file gambar (JPG, PNG, atau WebP)');
      return;
    }

    const toastId = toast.loading('Memproses gambar...');
    try {
      const compressedDataUrl = await compressImageFile(file);
      setTaskForm(f => ({ ...f, image: compressedDataUrl }));
      toast.success('Gambar berhasil dipasang!', { id: toastId });
    } catch (err) {
      toast.error('Gagal memproses gambar.', { id: toastId });
    }
  };

  // Open Task Modal for Add
  const handleOpenAddTask = (col: KanbanColumnType) => {
    setEditingTask(null);
    setTargetColumn(col);
    setTaskForm({
      title: '',
      description: '',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      tag: col === 'todo' ? 'Mobile' : col === 'progress' ? 'Design' : 'Frontend',
      tagColor: col === 'todo' ? 'blue' : col === 'progress' ? 'green' : 'orange',
      image: '',
    });
    setIsTaskModalOpen(true);
  };

  // Open Task Modal for Edit
  const handleOpenEditTask = (task: KanbanTask) => {
    setEditingTask(task);
    setTargetColumn(task.status);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      date: task.date || '24 Jul',
      tag: task.tag || 'General',
      tagColor: task.tagColor || 'blue',
      image: task.image || '',
    });
    setActiveMenuTaskId(null);
    setIsTaskModalOpen(true);
  };

  // Save Task (Add or Edit)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !selectedProjectId || !user?.email) return;
    const userEmail = user.email;

    if (editingTask) {
      // Edit
      const updated = tasks.map(t =>
        t.id === editingTask.id
          ? {
              ...t,
              title: taskForm.title.trim(),
              description: taskForm.description.trim() || undefined,
              status: targetColumn,
              date: taskForm.date.trim() || '24 Jul',
              tag: taskForm.tag.trim() || 'General',
              tagColor: taskForm.tagColor,
              image: taskForm.image || undefined,
            }
          : t
      );
      saveTasks(updated);

      try {
        await supabase.from('project_tasks').update({
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || null,
          status: targetColumn,
          date: taskForm.date.trim() || '24 Jul',
          tag: taskForm.tag.trim() || 'General',
          tag_color: taskForm.tagColor,
          image: taskForm.image || null,
        }).eq('id', editingTask.id);
      } catch {}

      toast.success('Task berhasil diperbarui');
    } else {
      // Create new
      const newTask: KanbanTask = {
        id: `task-${Date.now()}`,
        projectId: selectedProjectId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        status: targetColumn,
        date: taskForm.date.trim() || '24 Jul',
        tag: taskForm.tag.trim() || 'Mobile',
        tagColor: taskForm.tagColor,
        image: taskForm.image || undefined,
      };
      saveTasks([...tasks, newTask]);

      try {
        await supabase.from('project_tasks').insert({
          project_id: selectedProjectId,
          user_email: userEmail,
          title: newTask.title,
          description: newTask.description || null,
          status: newTask.status,
          date: newTask.date,
          tag: newTask.tag,
          tag_color: newTask.tagColor,
          image: newTask.image || null,
        });
      } catch {}

      toast.success('Task baru ditambahkan');
    }
    setIsTaskModalOpen(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedTaskId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, col: KanbanColumnType) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (id) {
      handleMoveTask(id, col);
    }
    setDraggedTaskId(null);
  };

  if (!mounted) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1580px] mx-auto space-y-6 bg-[#f8f9fc] min-h-screen">
      
      {/* ── TOP BREADCRUMB & HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-lg bg-zinc-900 text-white text-[11px] font-bold tracking-wider uppercase font-mono shadow-sm">
              Projects
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-[12px] text-zinc-400 font-medium">Kanban Board & Real Workspace</span>
          </div>

          {activeProject ? (
            <div className="flex items-start sm:items-center gap-3">
              <button
                onClick={() => setSelectedProjectId(null)}
                className="w-8 h-8 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 transition-colors shadow-xs cursor-pointer shrink-0 mt-0.5 sm:mt-0"
                title="Kembali ke Daftar Project"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-heading tracking-tight leading-tight">
                    {activeProject.name}
                  </h1>
                  <button
                    onClick={() => handleOpenEditProject(activeProject)}
                    className="w-7 h-7 rounded-lg hover:bg-zinc-200/70 text-zinc-400 hover:text-zinc-800 flex items-center justify-center transition-colors cursor-pointer"
                    title="Edit Pengaturan Project"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold text-zinc-700 bg-zinc-200/80 px-2.5 py-0.5 rounded-lg">
                    {activeProject.department}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-medium">
                    Deadline: <strong className="text-zinc-800 font-semibold">{formatDeadlineDisplay(activeProject.deadline)}</strong>
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getStatusBadgeStyle(activeProject.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {activeProject.status}
                  </span>
                  {activeProject.repo_link && (
                    <a
                      href={activeProject.repo_link.startsWith('http') ? activeProject.repo_link : `https://${activeProject.repo_link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Repo / Link <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Tech stack tags */}
                {activeProject.technologies && activeProject.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {activeProject.technologies.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-600 text-[10px] font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 font-heading tracking-tight leading-tight">
                Daftar Project
              </h1>
              <p className="text-[13px] text-zinc-400 mt-0.5 font-medium">
                Kelola project real-time Anda: Web Development, Mobile App, Video Editing, dan kelola papan Kanban.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {activeProject ? (
            <>
              {/* Quick Switch Project dropdown */}
              <select
                value={activeProject.id}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-zinc-200 bg-white text-[12px] font-semibold text-zinc-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900 cursor-pointer max-w-[160px] sm:max-w-none truncate"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => handleOpenAddTask('todo')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer shrink-0"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Tambah Task
              </button>
            </>
          ) : (
            <button
              onClick={handleOpenAddProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold transition-all shadow-sm cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Tambah Project Baru
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          VIEW 1: ALL REAL PROJECTS LIST (When no project is selected)
      ════════════════════════════════════════════════════════════════ */}
      {!activeProject && (
        <>
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((proj) => (
                <motion.div
                  key={proj.id}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className="bg-white rounded-[24px] p-5 sm:p-6 border border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between cursor-pointer group hover:border-zinc-300 transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800 text-[11px] font-bold tracking-tight">
                        {proj.department}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeStyle(proj.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {proj.status}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditProject(proj);
                          }}
                          className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition-colors"
                          title="Edit Project"
                        >
                          <EditIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(proj.id, e)}
                          className="w-7 h-7 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
                          title="Hapus Project"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-[17px] font-bold text-zinc-900 font-heading group-hover:text-black line-clamp-2 leading-snug">
                      {proj.name}
                    </h3>
                    {proj.description && (
                      <p className="text-[12px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    <p className="text-[11px] text-zinc-400 mt-2 font-medium">
                      Deadline: <span className="text-zinc-700 font-semibold">{formatDeadlineDisplay(proj.deadline)}</span>
                    </p>

                    {/* Tech stack badges */}
                    {proj.technologies && proj.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {proj.technologies.slice(0, 4).map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200/90 text-zinc-600 text-[10px] font-medium">
                            {t}
                          </span>
                        ))}
                        {proj.technologies.length > 4 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 text-[10px] font-bold">
                            +{proj.technologies.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="my-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-zinc-500">Progress Pengerjaan</span>
                        <span className="font-bold text-zinc-900">{proj.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            proj.status === 'Completed' ? 'bg-emerald-500' :
                            proj.status === 'On Hold' ? 'bg-amber-500' :
                            'bg-blue-600'
                          }`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-zinc-600">
                      <KanbanBoardIcon className="w-3.5 h-3.5 text-zinc-400" />
                      Buka Kanban Board
                    </span>
                    <span className="w-7 h-7 rounded-xl bg-zinc-900 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform shadow-xs">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Clean Empty State (No Dummy Data) */
            <div className="bg-white rounded-[28px] border border-zinc-200/80 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-700 flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <KanbanBoardIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 font-heading">
                Belum Ada Project
              </h3>
              <p className="text-[13px] text-zinc-500 mt-1.5 leading-relaxed max-w-md mx-auto">
                Mulai kelola project nyata Anda (Web Development, Mobile App, Video Editing). Tambahkan project pertama untuk membuka papan Kanban Todo, Progress, Pending, dan Done.
              </p>
              <button
                onClick={handleOpenAddProject}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[13px] font-bold transition-all shadow-md cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                Tambah Project Pertama
              </button>
            </div>
          )}
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          VIEW 2: REAL KANBAN BOARD (Matches user uploaded image)
          - 4 Columns: Todo, Progress, Pending, Done
      ════════════════════════════════════════════════════════════════ */}
      {activeProject && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS_CONFIG.map((col) => {
            const colTasks = tasks.filter(t => t.status === col.id);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`rounded-[26px] p-3 sm:p-3.5 ${col.bgClass} border ${col.borderClass} flex flex-col min-h-[520px] transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-1.5 mb-2.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] font-bold text-zinc-900 font-heading">
                      {col.title}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${col.badgeClass}`}>
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-zinc-600">
                    <button
                      onClick={() => handleOpenAddTask(col.id)}
                      className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
                      title={`Tambah task ke ${col.title}`}
                    >
                      <PlusIcon className="w-4 h-4 text-zinc-700" />
                    </button>
                    <button
                      onClick={() => handleOpenAddTask(col.id)}
                      className="w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors cursor-pointer"
                      title="Menu kolom"
                    >
                      <MoreVerticalIcon className="w-4 h-4 text-zinc-500" />
                    </button>
                  </div>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1">
                  {colTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      draggable
                      onDragStart={(e) => handleDragStart(e as any, task.id)}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white rounded-[20px] p-4 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] border border-zinc-100 flex flex-col justify-between relative group hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                    >
                      {/* Card Top: Title & 3-dot Menu */}
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-[13.5px] font-bold text-zinc-900 leading-snug line-clamp-2">
                          {task.title}
                        </h4>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
                            }}
                            className="w-6 h-6 rounded-md hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
                          >
                            <MoreVerticalIcon className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuTaskId === task.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 z-30 w-44 bg-white rounded-2xl shadow-xl border border-zinc-200 py-1.5 text-[11px] font-medium text-zinc-700"
                            >
                              <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                                Pindah Kolom
                              </div>
                              {COLUMNS_CONFIG.map(targetCol => (
                                <button
                                  key={targetCol.id}
                                  onClick={() => handleMoveTask(task.id, targetCol.id)}
                                  className={`w-full text-left px-3 py-1.5 hover:bg-zinc-100 flex items-center justify-between cursor-pointer ${
                                    task.status === targetCol.id ? 'font-bold text-zinc-900' : ''
                                  }`}
                                >
                                  <span>{targetCol.title}</span>
                                  {task.status === targetCol.id && <CheckIcon className="w-3 h-3 text-zinc-900" />}
                                </button>
                              ))}

                              <div className="h-px bg-zinc-100 my-1" />

                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-100 flex items-center gap-1.5 text-zinc-700 cursor-pointer"
                              >
                                <EditIcon className="w-3 h-3" />
                                Edit Task
                              </button>

                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-1.5 text-red-600 cursor-pointer"
                              >
                                <TrashIcon className="w-3 h-3" />
                                Hapus Task
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Optional Uploaded Thumbnail / Banner */}
                      {task.image && (
                        <div className="my-2.5 rounded-[14px] overflow-hidden bg-zinc-100 aspect-video max-h-[140px] w-full border border-black/5">
                          <img
                            src={task.image}
                            alt={task.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {/* Optional Description */}
                      {task.description && (
                        <p className="text-[12px] text-zinc-500 font-medium leading-relaxed my-1.5 line-clamp-3">
                          {task.description}
                        </p>
                      )}

                      {/* Card Footer: Date & Tag Pill */}
                      <div className="flex items-center justify-between pt-2.5 mt-1">
                        <div className="flex items-center gap-1.5 text-zinc-600 font-semibold text-[11px]">
                          <CalendarIcon className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{task.date}</span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-[10px] text-[10.5px] font-bold tracking-tight shadow-2xs ${getTagBadgeStyle(task.tagColor)}`}>
                          {task.tag}
                        </span>
                      </div>
                    </motion.div>
                  ))}

                  {/* Empty state for column */}
                  {colTasks.length === 0 && (
                    <div
                      onClick={() => handleOpenAddTask(col.id)}
                      className="border-2 border-dashed border-black/10 rounded-[20px] p-6 text-center text-zinc-400 hover:text-zinc-600 hover:border-black/20 hover:bg-white/40 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <PlusIcon className="w-4 h-4 text-zinc-400" />
                      <span className="text-[11px] font-semibold">Tarik atau Tambah Task</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: TAMBAH / EDIT TASK (DENGAN UPLOAD FILE GAMBAR) ── */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-zinc-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-zinc-900 font-heading">
                  {editingTask ? 'Edit Task Kanban' : 'Tambah Task Baru'}
                </h3>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 cursor-pointer"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Judul Task *</label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="misal: Design navigation changes"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">Deskripsi (Opsional)</label>
                  <textarea
                    rows={2}
                    value={taskForm.description}
                    onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Tuliskan catatan atau detail pengerjaan..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Kolom Status</label>
                    <select
                      value={targetColumn}
                      onChange={e => setTargetColumn(e.target.value as KanbanColumnType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    >
                      <option value="todo">Todo</option>
                      <option value="progress">Progress</option>
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Tanggal / Label</label>
                    <input
                      type="text"
                      value={taskForm.date}
                      onChange={e => setTaskForm(f => ({ ...f, date: e.target.value }))}
                      placeholder="e.g. 24 Jul"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Nama Tag</label>
                    <input
                      type="text"
                      value={taskForm.tag}
                      onChange={e => setTaskForm(f => ({ ...f, tag: e.target.value }))}
                      placeholder="e.g. Mobile, Design, AI"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Warna Badge Tag</label>
                    <select
                      value={taskForm.tagColor}
                      onChange={e => setTaskForm(f => ({ ...f, tagColor: e.target.value as any }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    >
                      <option value="blue">Biru (Mobile / Web)</option>
                      <option value="green">Hijau (Design / Video)</option>
                      <option value="orange">Orange (UX Stage / Pending)</option>
                      <option value="purple">Ungu (Backend / Database)</option>
                      <option value="slate">Abu-abu (General)</option>
                    </select>
                  </div>
                </div>

                {/* ── Direct Image File Upload (Bukan URL) ── */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1.5">
                    Foto / Gambar Banner Task (Upload File Langsung)
                  </label>

                  {taskForm.image ? (
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 p-2">
                      <img
                        src={taskForm.image}
                        alt="Preview task banner"
                        className="w-full h-36 object-cover rounded-xl"
                      />
                      <div className="flex items-center justify-between mt-2 px-1">
                        <span className="text-[11px] font-medium text-zinc-500 truncate">
                          Foto berhasil dipasang
                        </span>
                        <button
                          type="button"
                          onClick={() => setTaskForm(f => ({ ...f, image: '' }))}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                        >
                          Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50 rounded-2xl p-4 cursor-pointer transition-all">
                      <UploadImageIcon className="w-6 h-6 text-zinc-400 mb-1.5" />
                      <span className="text-[12px] font-bold text-zinc-700">Pilih / Upload Gambar</span>
                      <span className="text-[10px] text-zinc-400 mt-0.5 text-center">
                        Mendukung JPG, PNG, atau WebP (dari galeri HP atau komputer)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12px] font-bold cursor-pointer"
                  >
                    {editingTask ? 'Simpan Perubahan' : 'Tambah Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: TAMBAH / EDIT PROJECT LENGKAP & MOBILE RESPONSIVE ── */}
      <AnimatePresence>
        {isAddProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-4 my-auto max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">
                    {editingProject ? 'Edit Pengaturan Project' : 'Tambah Project Baru'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Lengkapi detail informasi project nyata yang sedang dikerjakan.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddProjectModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 cursor-pointer"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProject} className="space-y-4">
                {/* Nama Project */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Nama Project <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.name}
                    onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="misal: E-Commerce Mobile App"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                {/* Kategori & Deadline Tanggal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Kategori Project <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={projectForm.category}
                      onChange={e => setProjectForm(p => ({ ...p, category: e.target.value as ProjectCategory }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                      Deadline (Tanggal, Bulan, Tahun) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={projectForm.deadline}
                      onChange={e => setProjectForm(p => ({ ...p, deadline: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    />
                  </div>
                </div>

                {/* Status Project (Otomatis In Progress saat buat baru, bisa diubah jika edit) */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Status Project {editingProject ? '' : '(Otomatis Masuk "In Progress")'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['In Progress', 'On Hold', 'Completed'] as ProjectStatus[]).map(st => {
                      const isSel = projectForm.status === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setProjectForm(p => ({ ...p, status: st }))}
                          className={`py-2 px-2 rounded-xl text-[11.5px] font-bold transition-all border cursor-pointer ${
                            isSel
                              ? st === 'Completed'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : st === 'On Hold'
                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                          }`}
                        >
                          {st === 'In Progress' ? 'In Progress' : st === 'On Hold' ? 'On Hold (Ditunda)' : 'Completed (Selesai)'}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Link Repository / Project (Opsional) */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Link Repository / Preview Project <span className="text-zinc-400 font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={projectForm.repo_link}
                    onChange={e => setProjectForm(p => ({ ...p, repo_link: e.target.value }))}
                    placeholder="https://github.com/username/project atau link figma/preview"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                {/* Deskripsi (Opsional) */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                    Deskripsi Project <span className="text-zinc-400 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={projectForm.description}
                    onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Catatan ringkas mengenai cakupan atau tujuan project ini..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-[13px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                  />
                </div>

                {/* Teknologi & Tools (Multi-Select Pills) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-zinc-700">
                      Teknologi & Tools yang Digunakan <span className="text-zinc-400 font-normal">(Pilih lebih dari 1)</span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {projectForm.technologies.length} terpilih
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 max-h-44 overflow-y-auto">
                    {PRESET_TECHNOLOGIES.map((tech) => {
                      const isSelected = projectForm.technologies.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => handleToggleTech(tech)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-900 text-white border-zinc-900 shadow-2xs font-bold'
                              : 'bg-white text-zinc-600 border-zinc-200/90 hover:bg-zinc-100'
                          }`}
                        >
                          {isSelected ? `✓ ${tech}` : tech}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tambah Custom Tech */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={projectForm.customTech}
                      onChange={e => setProjectForm(p => ({ ...p, customTech: e.target.value }))}
                      onKeyDown={handleAddCustomTech}
                      placeholder="Ketik tool/teknologi lain lalu tekan Enter..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-200 text-[12px] text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTech}
                      className="px-3 py-1.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-[11.5px] font-bold transition-colors cursor-pointer"
                    >
                      + Tambah
                    </button>
                  </div>
                </div>

                {/* Tombol Simpan / Batal */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsAddProjectModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-[12.5px] font-bold shadow-sm transition-all cursor-pointer"
                  >
                    {editingProject ? 'Simpan Perubahan' : 'Buat Project Sekarang'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
