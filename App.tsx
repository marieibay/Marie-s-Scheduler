
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Project, ViewMode } from './types';
import { supabase } from './supabaseClient';
import { 
    ManagerView, 
    ClientView, 
    EditorView,
    DeleteConfirmationModal,
    PlusIcon,
    DailyNotesWidget,
    MemoIcon
} from './components';
import { getClientName } from './utils';
import { ProjectCard } from './components';

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
    dailyNotesContent: string;
    onAddProject: () => void;
    onUpdateProject: (id: number, field: keyof Project, value: string | number | boolean | null) => void;
    onNotesChange: (newContent: string) => void;
    isNewEditColumnMissing: boolean;
    isLoading: boolean;
}> = ({ projects, dailyNotesContent, onAddProject, onUpdateProject, onNotesChange, isNewEditColumnMissing, isLoading }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [currentPage, setCurrentPage] = useState<'ongoing' | 'done' | 'all-active' | 'archived' | 'editorView'>('ongoing');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'date'>('default');
    
    // --- DERIVE STATE DIRECTLY FROM PROPS ON EVERY RENDER ---
    const ongoingProjects = useMemo(() => projects.filter(p => p.status === 'ongoing'), [projects]);
    const doneProjects = useMemo(() => projects.filter(p => p.status === 'done'), [projects]);
    const archivedProjects = useMemo(() => projects.filter(p => p.status === 'archived'), [projects]);

    const getGroupedAndSortedProjects = useMemo(() => {
        const CLIENT_ORDER = ['PRH', 'ANATOLE', 'AUDIBLE', 'HAY HOUSE', 'ONS', 'PODIUM', 'CURATED AUDIO', 'Bloomsbury'];
        
        return (projectsToProcess: Project[]) => {
            if (!projectsToProcess || projectsToProcess.length === 0) {
                return { groupedProjects: {}, sortedClients: [] };
            }

            const groupedProjects = projectsToProcess.reduce((acc, project) => {
                const clientName = getClientName(project);
                if (!acc[clientName]) acc[clientName] = [];
                acc[clientName].push(project);
                return acc;
            }, {} as Record<string, Project[]>);

            Object.values(groupedProjects).forEach(group => {
                group.sort((a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                });
            });

            const sortedClients = Object.keys(groupedProjects).sort((a, b) => {
                const indexA = CLIENT_ORDER.indexOf(a);
                const indexB = CLIENT_ORDER.indexOf(b);
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.localeCompare(b);
            });
            
            return { groupedProjects, sortedClients };
        };
    }, []);

    // Reset sort when user navigates away from the manager ongoing view
    useEffect(() => {
        if (currentPage !== 'ongoing' || viewMode !== 'manager') {
            setSortBy('default');
        }
    }, [currentPage, viewMode]);

    const handleOpenDeleteModal = useCallback((project: Project) => setProjectToDelete(project), []);
    const handleCloseDeleteModal = useCallback(() => setProjectToDelete(null), []);
    const handleConfirmDelete = useCallback(async () => {
        if (projectToDelete) {
            onUpdateProject(projectToDelete.id, 'status', 'deleted'); // This will trigger a DELETE via the main handler
            setProjectToDelete(null);
        }
    }, [projectToDelete, onUpdateProject]);

    const renderCurrentView = () => {
        // Editor View is separate
        if (currentPage === 'editorView') {
            const sortedProjects = [...ongoingProjects].sort((a,b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
            return <EditorView projects={sortedProjects} onUpdate={onUpdateProject} />;
        }

        // Client View is always grouped and shows ongoing projects
        if (viewMode === 'client') {
            const { groupedProjects, sortedClients } = getGroupedAndSortedProjects(ongoingProjects);

            if (sortedClients.length === 0) {
                return <div className="text-center text-gray-500 py-10">No projects to display in this category.</div>;
            }

            return (
                <div className="space-y-8">
                    {sortedClients.map(clientName => (
                        <div key={clientName}>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">{clientName}</h2>
                            <div className="space-y-4">
                                {groupedProjects[clientName].map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onUpdate={onUpdateProject}
                                        isClientView={true}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // New All Active view (Manager only)
        if (currentPage === 'all-active') {
            const projectsToDisplay = projects.filter(p => p.status === 'ongoing' || p.status === 'done');
            const { groupedProjects, sortedClients } = getGroupedAndSortedProjects(projectsToDisplay);

            if (sortedClients.length === 0) {
                return <div className="text-center text-gray-500 py-10">No active projects to display.</div>;
            }

            return (
                <div className="space-y-8">
                    {sortedClients.map(clientName => (
                        <div key={clientName}>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">{clientName}</h2>
                            <div className="space-y-4">
                                {groupedProjects[clientName].map(project => (
                                    <ProjectCard
                                        key={project.id}
                                        project={project}
                                        onUpdate={onUpdateProject}
                                        onDelete={handleOpenDeleteModal}
                                        isClientView={false}
                                        isNewEditColumnMissing={isNewEditColumnMissing}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }
        
        // Manager View logic
        let projectsForView: Project[];

        if (currentPage === 'ongoing') {
            if (sortBy === 'date') {
                projectsForView = [...ongoingProjects].sort((a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                });
            } else { // default sort: unassigned first, then newest first
                projectsForView = [...ongoingProjects].sort((a, b) => {
                    const aUnassigned = !a.editor || !a.master || !a.pz_qc;
                    const bUnassigned = !b.editor || !b.master || !b.pz_qc;
                    if (aUnassigned !== bUnassigned) {
                        return aUnassigned ? -1 : 1;
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
            }
        } else if (currentPage === 'done') {
            projectsForView = doneProjects;
        } else { // archived
            projectsForView = archivedProjects;
        }

        return <ManagerView projects={projectsForView} onUpdate={onUpdateProject} onDelete={handleOpenDeleteModal} isNewEditColumnMissing={isNewEditColumnMissing} />;
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
                                <>
                                    <button onClick={() => setIsNotesVisible(true)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-transform duration-150 ease-in-out active:scale-95 flex items-center">
                                        <MemoIcon />
                                        <span className="hidden sm:inline">Daily Notes</span>
                                    </button>
                                    <button 
                                        onClick={() => { onAddProject(); setCurrentPage('ongoing'); }} 
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-transform duration-150 ease-in-out active:scale-95 active:bg-indigo-800 flex items-center disabled:bg-indigo-400 disabled:cursor-not-allowed"
                                        disabled={isLoading}
                                    >
                                        <PlusIcon />
                                        <span className="hidden sm:inline">Add Project</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </header>
    
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setCurrentPage('ongoing')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'ongoing' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Ongoing Edits</button>
                                    <button onClick={() => setCurrentPage('done')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'done' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Edit Done</button>
                                    <button onClick={() => setCurrentPage('all-active')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'all-active' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>All Active</button>
                                    <button onClick={() => setCurrentPage('archived')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'archived' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Archived Projects</button>
                                    <button onClick={() => setCurrentPage('editorView')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'editorView' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Editor View</button>
                                </div>
                                {currentPage === 'ongoing' && viewMode === 'manager' && (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setSortBy('date')} 
                                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${sortBy === 'date' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            Sort by Date
                                        </button>
                                        <button 
                                            onClick={() => setSortBy('default')} 
                                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${sortBy === 'default' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            Reset Sort
                                        </button>
                                    </div>
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
                 <div className="mt-8">
                    {renderCurrentView()}
                 </div>
            </main>

            {isNotesVisible && viewMode === 'manager' && (
                <DailyNotesWidget
                    content={dailyNotesContent}
                    onContentChange={onNotesChange}
                    onClose={() => setIsNotesVisible(false)}
                />
            )}

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
    const [dailyNotesContent, setDailyNotesContent] = useState('');
    const [route, setRoute] = useState(window.location.pathname);
    const [isNewEditColumnMissing, setIsNewEditColumnMissing] = useState(false);
    const newEditFailureDetected = useRef(false);
    const [isLoading, setIsLoading] = useState(true);

    // --- CENTRALIZED DATA FETCHING & REAL-TIME SUBSCRIPTION ---
    useEffect(() => {
        // Proactively check for the existence of the 'is_new_edit' column on startup.
        const probeForNewEditColumn = async () => {
            if (newEditFailureDetected.current) return;
            // This query will fail if the column doesn't exist, allowing us to disable the feature early.
            const { error } = await supabase.from('projects').select('is_new_edit').limit(1);
            if (error && error.message.includes("Could not find the 'is_new_edit' column")) {
                console.warn("Feature 'New Edit' is unavailable. Proactively disabling.");
                newEditFailureDetected.current = true;
                setIsNewEditColumnMissing(true);
            }
        };

        // Fetch projects
        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) console.error('Error fetching initial projects:', error.message);
            else {
                const augmentedData = (data || []).map(p => ({ ...p, is_new_edit: p.is_new_edit || false }));
                setProjects(augmentedData as Project[]);
            }
        };

        // Fetch daily notes
        const fetchNotes = async () => {
            const { data, error } = await supabase.from('daily_notes').select('content').eq('id', 1).single();
            if (error) console.error('Error fetching notes:', error.message);
            else setDailyNotesContent(data?.content || '');
        };
        
        // Run all startup tasks, ensuring the feature probe happens first.
        const startup = async () => {
            await probeForNewEditColumn();
            await Promise.all([fetchProjects(), fetchNotes()]);
            setIsLoading(false);
        };
        
        startup();

        // Subscribe to project changes
        const projectsChannel = supabase.channel('projects')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
              if (payload.eventType === 'INSERT') {
                  setProjects(currentProjects => {
                    const newProject = { ...payload.new, is_new_edit: (payload.new as Project).is_new_edit || false } as Project;
                    if (currentProjects.some(p => p.id === newProject.id)) {
                        return currentProjects.map(p => p.id === newProject.id ? newProject : p);
                    }
                    return [newProject, ...currentProjects];
                  });
              } else if (payload.eventType === 'UPDATE') {
                  setProjects(currentProjects => currentProjects.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p));
              } else if (payload.eventType === 'DELETE') {
                  setProjects(currentProjects => currentProjects.filter(p => p.id !== (payload.old as {id: number}).id));
              }
          }).subscribe();

        // Subscribe to daily notes changes
        const notesChannel = supabase.channel('daily_notes')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'daily_notes', filter: 'id=eq.1' }, payload => {
            setDailyNotesContent((payload.new as { content: string }).content);
          }).subscribe();

        return () => {
            supabase.removeChannel(projectsChannel);
            supabase.removeChannel(notesChannel);
        };
    }, []);

    // --- CENTRALIZED HANDLER FUNCTIONS ---
    
    const debouncedSaveNotes = useCallback(
      debounce(async (newContent: string) => {
        const { error } = await supabase.from('daily_notes').update({ content: newContent, last_updated: new Date().toISOString() }).eq('id', 1);
        if (error) console.error('Failed to save notes:', error.message);
      }, 1000), // 1-second debounce
      []
    );

    const handleNotesChange = useCallback((newContent: string) => {
        setDailyNotesContent(newContent);
        debouncedSaveNotes(newContent);
    }, [debouncedSaveNotes]);


    const handleAddNewProject = useCallback(async () => {
        const tempId = -Date.now();
        const tempProject: Project = {
            id: tempId, created_at: new Date().toISOString(), title: 'New Project - Click to Edit Title',
            due_date: null, original_due_date: null,
            notes: '', editor: '', editor_note: '', pz_qc: '', pz_qc_note: '', master: '', master_note: '',
            est_rt: 0, total_edited: 0, remaining_raw: 0, is_on_hold: false, is_new_edit: false, status: 'ongoing' as const,
        };
        setProjects(currentProjects => [tempProject, ...currentProjects]);

        const { id, created_at, ...newProjectDataWithoutMeta } = tempProject;
        const newProjectData: Partial<Project> = { ...newProjectDataWithoutMeta };

        // If we know the column is missing, don't try to insert it.
        if (newEditFailureDetected.current) {
            delete newProjectData.is_new_edit;
        }

        const { data: newProjectFromDb, error } = await supabase.from('projects').insert(newProjectData).select().single();
        if (error) {
            setProjects(currentProjects => currentProjects.filter(p => p.id !== tempId));
            
            if (error.message.includes("Could not find the 'is_new_edit' column")) {
                alert("Failed to create project. This feature requires a database change. Please add a boolean column named 'is_new_edit' to your 'projects' table in Supabase.");
                if (!newEditFailureDetected.current) {
                    newEditFailureDetected.current = true;
                    setIsNewEditColumnMissing(true);
                }
            } else {
                console.error("Error creating project:", error);
                alert(`Failed to add project: ${error.message}`);
            }
        } else if (newProjectFromDb) {
            const newProject = { ...newProjectFromDb, is_new_edit: newProjectFromDb.is_new_edit || false } as Project;
            setProjects(currentProjects => currentProjects.map(p => p.id === tempId ? newProject : p));
        }
    }, []);

    const handleUpdateProjectField = useCallback(async (id: number, field: keyof Project, value: any) => {
        if (field === 'is_new_edit' && (isNewEditColumnMissing || newEditFailureDetected.current)) {
            console.warn("Update for 'is_new_edit' blocked because the database column is missing.");
            return; 
        }

        const projectForRollback = projects.find(p => p.id === id);

        if (!projectForRollback) {
            console.error(`Project with id ${id} not found for update. It may have been deleted by another user.`);
            return;
        }

        const isDelete = field === 'status' && value === 'deleted';

        if (isDelete) {
            setProjects(currentProjects => currentProjects.filter(p => p.id !== id));
        } else {
            setProjects(currentProjects => currentProjects.map(p => p.id === id ? { ...p, [field]: value } : p));
        }

        const { error } = isDelete
            ? await supabase.from('projects').delete().eq('id', id)
            : await supabase.from('projects').update({ [field]: value }).eq('id', id);

        if (error) {
            console.error(`Failed to ${isDelete ? 'delete' : 'update'} project:`, error.message);

            if (isDelete) {
                setProjects(currentProjects => {
                    if (currentProjects.some(p => p.id === id)) return currentProjects;
                    return [projectForRollback, ...currentProjects];
                });
            } else {
                setProjects(currentProjects => currentProjects.map(p =>
                    p.id === id ? { ...p, [field]: projectForRollback[field] } : p
                ));
            }
            
            if (error.message.includes("Could not find the 'is_new_edit' column")) {
                console.error("Feature 'New Edit' is unavailable. Please add a boolean column named 'is_new_edit' to your 'projects' table in Supabase.");
                if (!newEditFailureDetected.current) {
                    newEditFailureDetected.current = true;
                    setIsNewEditColumnMissing(true);
                }
            } else {
                alert(`Failed to update project: ${error.message}.`);
            }
        }
    }, [projects, isNewEditColumnMissing]);


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

    // Helper for debouncing
    function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
      };
    }

    if (route === '/editor' || route === '/editor.html') {
        return <EditorPage projects={projects} onUpdate={handleUpdateProjectField} />;
    }
    return <ManagerDashboard projects={projects} dailyNotesContent={dailyNotesContent} onAddProject={handleAddNewProject} onUpdateProject={handleUpdateProjectField} onNotesChange={handleNotesChange} isNewEditColumnMissing={isNewEditColumnMissing} isLoading={isLoading} />;
};

export default App;
