
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Project, ViewMode } from './types';
import { supabase } from './supabaseClient';
import { 
    ManagerView, 
    ClientView, 
    EditorView,
    DeleteConfirmationModal,
    PlusIcon
} from './components';

// --- EDITOR PAGE COMPONENT (replaces editor.tsx) ---
const EditorPage: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*').eq('status', 'ongoing');
            if (error) console.error('Error fetching editor projects:', error.message);
            else setProjects(data || []);
        };
        fetchProjects();

        // Use a unique channel name to prevent conflicts
        const channel = supabase.channel(`editor-projects-channel:${Math.random()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
              if (payload.eventType === 'INSERT') {
                  setProjects(currentProjects => {
                    const newProject = payload.new as Project;
                     if (currentProjects.some(p => p.id === newProject.id)) {
                        return currentProjects.map(p => p.id === newProject.id ? newProject : p);
                    }
                    return [newProject, ...currentProjects];
                  });
              } else if (payload.eventType === 'UPDATE') {
                  setProjects(currentProjects => currentProjects.map(p => p.id === payload.new.id ? payload.new as Project : p));
              } else if (payload.eventType === 'DELETE') {
                  setProjects(currentProjects => currentProjects.filter(p => p.id !== (payload.old as Project).id));
              }
          }).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleUpdateProjectField = useCallback(async (id: number, field: keyof Project, value: string | number | boolean) => {
        setProjects(currentProjects =>
            currentProjects.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );
        const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error('Error updating project field:', error.message);
             const { data, error: fetchError } = await supabase.from('projects').select('*').eq('status', 'ongoing');
            if (fetchError) console.error('Error refetching editor projects:', fetchError.message);
            else setProjects(data || []);
        }
    }, []);

    const editorProjects = useMemo(() => {
        return [...projects]
          .filter(p => p.status === 'ongoing')
          .sort((a, b) => {
            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          });
    }, [projects]);
    
    return (
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                <p className="text-gray-600">Editor Workflow</p>
            </div>
        </header>
        <main>
          <EditorView projects={editorProjects} onUpdate={handleUpdateProjectField} />
        </main>
      </div>
    );
};

// --- MANAGER DASHBOARD COMPONENT (original App component logic) ---
const ManagerDashboard: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [currentPage, setCurrentPage] = useState<'ongoing' | 'done' | 'archived' | 'editorView'>('ongoing');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) console.error('Error fetching manager projects:', error.message);
            else setProjects(data || []);
        };
        fetchProjects();

        // Use a unique channel name to prevent conflicts
        const channel = supabase.channel(`manager-projects-channel:${Math.random()}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
              if (payload.eventType === 'INSERT') {
                  setProjects(currentProjects => {
                    const newProject = payload.new as Project;
                    if (currentProjects.some(p => p.id === newProject.id)) {
                        return currentProjects.map(p => p.id === newProject.id ? newProject : p);
                    }
                    return [newProject, ...currentProjects];
                  });
              } else if (payload.eventType === 'UPDATE') {
                  setProjects(currentProjects => currentProjects.map(p => p.id === payload.new.id ? payload.new as Project : p));
              } else if (payload.eventType === 'DELETE') {
                  setProjects(currentProjects => currentProjects.filter(p => p.id !== (payload.old as Project).id));
              }
          }).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const ongoingProjects = useMemo(() => {
        return projects
            .filter(p => p.status === 'ongoing')
            .sort((a, b) => {
                const isAUnassigned = !a.editor && !a.master && !a.pz_qc;
                const isBUnassigned = !b.editor && !b.master && !b.pz_qc;

                if (isAUnassigned && !isBUnassigned) return -1;
                if (!isAUnassigned && isBUnassigned) return 1;

                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
    }, [projects]);
    const doneProjects = useMemo(() => projects.filter(p => p.status === 'done'), [projects]);
    const archivedProjects = useMemo(() => projects.filter(p => p.status === 'archived'), [projects]);
    
    const handleAddNewProject = useCallback(async () => {
      const tempId = -Date.now(); // Use negative temp ID
      const tempProject: Project = {
        id: tempId,
        created_at: new Date().toISOString(),
        title: 'New Project - Click to Edit Title',
        due_date: new Date().toISOString().split('T')[0],
        original_due_date: new Date().toISOString().split('T')[0],
        notes: '',
        editor: '',
        editor_note: '',
        pz_qc: '',
        pz_qc_note: '',
        master: '',
        master_note: '',
        est_rt: 0,
        total_edited: 0,
        remaining_raw: 0,
        is_on_hold: false,
        status: 'ongoing' as const,
      };

      setProjects(currentProjects => [tempProject, ...currentProjects]);
      setCurrentPage('ongoing');

      const { id, created_at, ...newProjectData } = tempProject;

      const { data: newProject, error } = await supabase
        .from('projects')
        .insert(newProjectData)
        .select()
        .single();

      if (error) {
          console.error("Error creating project:", error);
          alert(`Failed to add project: ${error.message}`);
          setProjects(currentProjects => currentProjects.filter(p => p.id !== tempId));
      } else if (newProject) {
          setProjects(currentProjects => 
            currentProjects.map(p => p.id === tempId ? newProject : p)
          );
      }
    }, []);

    const handleUpdateProjectField = useCallback(async (id: number, field: keyof Project, value: string | number | boolean | null) => {
        setProjects(currentProjects =>
            currentProjects.map(p =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );

        const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id);

        if (error) {
            console.error('Error updating project field:', error.message);
            alert(`Failed to update project: ${error.message}.`);
            const { data, error: fetchError } = await supabase.from('projects').select('*');
            if (fetchError) console.error('Error refetching projects:', fetchError.message);
            else setProjects(data || []);
        }
    }, []);
    
    const handleSortByDate = useCallback(() => {
        setProjects(prevProjects => {
            const currentTab = currentPage === 'editorView' ? 'ongoing' : currentPage;
            const projectsForPage = prevProjects.filter(p => p.status === currentTab);
            const otherProjects = prevProjects.filter(p => p.status !== currentTab);

            const sorted = [...projectsForPage].sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });

            return [...sorted, ...otherProjects];
        });
    }, [currentPage]);

    const handleOpenDeleteModal = useCallback((project: Project) => setProjectToDelete(project), []);
    const handleCloseDeleteModal = useCallback(() => setProjectToDelete(null), []);
    const handleConfirmDelete = useCallback(async () => {
        if (projectToDelete) {
            setProjects(currentProjects => currentProjects.filter(p => p.id !== projectToDelete.id));
            const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
            if(error) {
                console.error("Error deleting project:", error.message);
                alert(`Failed to delete project: ${error.message}.`);
                const { data, error: fetchError } = await supabase.from('projects').select('*');
                if (fetchError) console.error('Error refetching projects:', fetchError.message);
                else setProjects(data || []);
            }
            setProjectToDelete(null);
        }
    }, [projectToDelete]);

    const renderCurrentView = () => {
        if (currentPage === 'editorView') {
            return <EditorView projects={ongoingProjects} onUpdate={handleUpdateProjectField} />;
        }

        let projectsForPage: Project[];
        switch(currentPage) {
            case 'ongoing': projectsForPage = ongoingProjects; break;
            case 'done': projectsForPage = doneProjects; break;
            case 'archived': projectsForPage = archivedProjects; break;
            default: projectsForPage = [];
        }
        
        return viewMode === 'manager'
            ? <ManagerView projects={projectsForPage} onUpdate={handleUpdateProjectField} onDelete={handleOpenDeleteModal} />
            : <ClientView projects={projectsForPage} onUpdate={handleUpdateProjectField} />;
    };

    return (
        <>
            <div className="sticky top-0 z-20 w-full bg-gray-100/95 backdrop-blur-sm border-b border-gray-200">
                <div className="container mx-auto px-4 md:px-8">
                    <header className="flex flex-col gap-4 md:flex-row justify-between items-center pt-6 pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                            <p className="text-gray-600">Manage your post-production workflow.</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {viewMode === 'manager' && (
                                <button onClick={handleAddNewProject} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-transform duration-150 ease-in-out active:scale-95 active:bg-indigo-800 flex items-center">
                                    <PlusIcon />
                                    <span className="hidden sm:inline">Add Project</span>
                                </button>
                            )}
                        </div>
                    </header>
    
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setCurrentPage('ongoing')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'ongoing' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Ongoing Edits</button>
                                    <button onClick={() => setCurrentPage('done')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'done' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Edit Done</button>
                                    <button onClick={() => setCurrentPage('archived')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'archived' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Archived Projects</button>
                                    <button onClick={() => setCurrentPage('editorView')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'editorView' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Editor View</button>
                                </div>
                                {viewMode === 'manager' && (
                                    <button onClick={handleSortByDate} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm">
                                        Sort by Date
                                    </button>
                                 )}
                            </div>
        
                            <div className="flex items-center gap-4 sm:ml-auto">
                                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                    <span className="text-sm font-medium hidden sm:block px-2">View Mode:</span>
                                    <button onClick={() => setViewMode('manager')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'manager' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Manager</button>
                                    <button onClick={() => setViewMode('client')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'client' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Client</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 md:px-8 py-8">
                 {renderCurrentView()}
            </main>

            {projectToDelete && (
                <DeleteConfirmationModal
                    projectTitle={projectToDelete.title}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCloseDeleteModal}
                />
            )}
        </>
    );
};

// --- MAIN ROUTER COMPONENT ---
const App: React.FC = () => {
    const [route, setRoute] = useState(window.location.pathname);

    useEffect(() => {
        const onLocationChange = () => {
            setRoute(window.location.pathname);
        };
        window.addEventListener('popstate', onLocationChange);
        // Also handle direct navigation and refreshes
        window.history.pushState = new Proxy(window.history.pushState, {
            apply: (target, thisArg, argArray) => {
                target.apply(thisArg, argArray);
                onLocationChange();
                return target;
            },
        });
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);

    if (route === '/editor' || route === '/editor.html') {
        return <EditorPage />;
    }
    return <ManagerDashboard />;
};

export default App;
