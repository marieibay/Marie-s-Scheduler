
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

// --- CHILD COMPONENTS (Now receive state and handlers via props) ---

const EditorPage: React.FC<{
    projects: Project[]; 
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
}> = ({ projects, onUpdate }) => {

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
          <EditorView projects={editorProjects} onUpdate={onUpdate} />
        </main>
      </div>
    );
};

const ManagerDashboard: React.FC<{
    projects: Project[];
    onAddProject: () => void;
    onUpdateProject: (id: number, field: keyof Project, value: string | number | boolean | null) => void;
}> = ({ projects, onAddProject, onUpdateProject }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [currentPage, setCurrentPage] = useState<'ongoing' | 'done' | 'archived' | 'editorView'>('ongoing');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [sortByDate, setSortByDate] = useState(false);

    // Reset sort when changing tabs for a consistent experience
    useEffect(() => {
        setSortByDate(false);
    }, [currentPage]);
    
    const ongoingProjects = useMemo(() => {
        const filtered = projects.filter(p => p.status === 'ongoing');
        
        if (sortByDate && currentPage === 'ongoing') {
            return filtered.sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
        }
        
        // Default sort: unassigned first, then by due date
        return filtered.sort((a, b) => {
            const isAUnassigned = !a.editor && !a.master && !a.pz_qc;
            const isBUnassigned = !b.editor && !b.master && !b.pz_qc;

            if (isAUnassigned && !isBUnassigned) return -1;
            if (!isAUnassigned && isBUnassigned) return 1;

            if (!a.due_date) return 1;
            if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });
    }, [projects, currentPage, sortByDate]);

    const doneProjects = useMemo(() => projects.filter(p => p.status === 'done'), [projects]);
    const archivedProjects = useMemo(() => projects.filter(p => p.status === 'archived'), [projects]);
    
    const handleSortByDate = useCallback(() => {
        setSortByDate(prev => !prev);
    }, []);

    const handleOpenDeleteModal = useCallback((project: Project) => setProjectToDelete(project), []);
    const handleCloseDeleteModal = useCallback(() => setProjectToDelete(null), []);
    const handleConfirmDelete = useCallback(async () => {
        if (projectToDelete) {
            onUpdateProject(projectToDelete.id, 'status', 'deleted'); // This will trigger a DELETE via the main handler
            setProjectToDelete(null);
        }
    }, [projectToDelete, onUpdateProject]);

    const renderCurrentView = () => {
        if (currentPage === 'editorView') {
            return <EditorView projects={ongoingProjects} onUpdate={onUpdateProject} />;
        }

        let projectsForPage: Project[];
        switch(currentPage) {
            case 'ongoing': projectsForPage = ongoingProjects; break;
            case 'done': projectsForPage = doneProjects; break;
            case 'archived': projectsForPage = archivedProjects; break;
            default: projectsForPage = [];
        }
        
        return viewMode === 'manager'
            ? <ManagerView projects={projectsForPage} onUpdate={onUpdateProject} onDelete={handleOpenDeleteModal} />
            : <ClientView projects={projectsForPage} onUpdate={onUpdateProject} />;
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
                                <button onClick={() => { onAddProject(); setCurrentPage('ongoing'); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-transform duration-150 ease-in-out active:scale-95 active:bg-indigo-800 flex items-center">
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
                                {viewMode === 'manager' && currentPage === 'ongoing' && (
                                    <button onClick={handleSortByDate} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm">
                                        {sortByDate ? 'Default Sort' : 'Sort by Date'}
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

// --- MAIN APP CONTAINER (Manages state, data fetching, and routing) ---
const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [route, setRoute] = useState(window.location.pathname);

    // --- CENTRALIZED DATA FETCHING & REAL-TIME SUBSCRIPTION ---
    useEffect(() => {
        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) console.error('Error fetching initial projects:', error.message);
            else setProjects(data || []);
        };
        fetchProjects();

        // The single, authoritative subscription for the entire application
        const channel = supabase.channel('projects')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
              if (payload.eventType === 'INSERT') {
                  setProjects(currentProjects => {
                    const newProject = payload.new as Project;
                    // Avoid duplicates from optimistic updates
                    if (currentProjects.some(p => p.id === newProject.id)) {
                        return currentProjects.map(p => p.id === newProject.id ? newProject : p);
                    }
                    return [newProject, ...currentProjects];
                  });
              } else if (payload.eventType === 'UPDATE') {
                  setProjects(currentProjects => currentProjects.map(p => p.id === payload.new.id ? payload.new as Project : p));
              } else if (payload.eventType === 'DELETE') {
                  setProjects(currentProjects => currentProjects.filter(p => p.id !== (payload.old as {id: number}).id));
              }
          }).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // --- CENTRALIZED HANDLER FUNCTIONS ---

    const handleAddNewProject = useCallback(async () => {
        const tempId = -Date.now();
        const tempProject: Project = {
            id: tempId, created_at: new Date().toISOString(), title: 'New Project - Click to Edit Title',
            due_date: new Date().toISOString().split('T')[0], original_due_date: new Date().toISOString().split('T')[0],
            notes: '', editor: '', editor_note: '', pz_qc: '', pz_qc_note: '', master: '', master_note: '',
            est_rt: 0, total_edited: 0, remaining_raw: 0, is_on_hold: false, status: 'ongoing' as const,
        };
        setProjects(currentProjects => [tempProject, ...currentProjects]);

        const { id, created_at, ...newProjectData } = tempProject;

        const { data: newProject, error } = await supabase.from('projects').insert(newProjectData).select().single();
        if (error) {
            console.error("Error creating project:", error);
            alert(`Failed to add project: ${error.message}`);
            setProjects(currentProjects => currentProjects.filter(p => p.id !== tempId));
        } else if (newProject) {
            setProjects(currentProjects => currentProjects.map(p => p.id === tempId ? newProject : p));
        }
    }, []);

    const handleUpdateProjectField = useCallback(async (id: number, field: keyof Project, value: any) => {
        // Handle Delete requests
        if (field === 'status' && value === 'deleted') {
            setProjects(currentProjects => currentProjects.filter(p => p.id !== id));
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if(error) {
                alert(`Failed to delete project: ${error.message}.`);
                const { data } = await supabase.from('projects').select('*');
                setProjects(data || []);
            }
            return;
        }

        // Optimistic UI Update
        setProjects(currentProjects =>
            currentProjects.map(p => p.id === id ? { ...p, [field]: value } : p)
        );
        
        // Update database
        const { error } = await supabase.from('projects').update({ [field]: value }).eq('id', id);
        if (error) {
            console.error('Error updating project field:', error.message);
            alert(`Failed to update project: ${error.message}.`);
            // Revert on error
            const { data } = await supabase.from('projects').select('*');
            setProjects(data || []);
        }
    }, []);

    // --- ROUTING ---
    useEffect(() => {
        const onLocationChange = () => setRoute(window.location.pathname);
        window.addEventListener('popstate', onLocationChange);
        window.history.pushState = new Proxy(window.history.pushState, {
            apply: (target, thisArg, argArray) => {
                const result = target.apply(thisArg, argArray);
                onLocationChange();
                return result;
            },
        });
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);

    if (route === '/editor' || route === '/editor.html') {
        return <EditorPage projects={projects} onUpdate={handleUpdateProjectField} />;
    }
    return <ManagerDashboard projects={projects} onAddProject={handleAddNewProject} onUpdateProject={handleUpdateProjectField} />;
};

export default App;
