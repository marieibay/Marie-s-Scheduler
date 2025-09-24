import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Project, ViewMode, ProductivityLog, QCProductivityLog } from './types';
import { supabase } from './supabaseClient';
import { 
    ManagerView, 
    ClientView, 
    DeleteConfirmationModal,
    PlusIcon,
    DailyNotesWidget,
    MemoIcon,
    ProjectLoggerDashboard,
    TeamProductivityView,
    PersonalStatsView,
} from './components';
import { QCDashboard } from './QCDashboard';
import { getClientName } from './utils';
import { ProjectCard } from './components';
import { editors } from './employees';
import { Auth } from './Auth';
import { Session } from '@supabase/supabase-js';
import { SetPassword } from './SetPassword';


// --- CHILD COMPONENTS (Now receive state and handlers via props) ---

const EditorDashboard: React.FC<{
    projects: Project[]; 
    productivityLogs: ProductivityLog[];
    onUpdateProjectField: (id: number, field: keyof Project, value: string | number | boolean) => void;
}> = ({ projects, productivityLogs, onUpdateProjectField }) => {
    const [activeTab, setActiveTab] = useState('logHours');
    const [selectedEditor, setSelectedEditor] = useState<string>(() => {
        return localStorage.getItem('selectedEditor') || (editors.length > 0 ? editors[0] : '');
    });

    useEffect(() => {
        localStorage.setItem('selectedEditor', selectedEditor);
    }, [selectedEditor]);

    const allOngoingProjects = useMemo(() => {
        return [...projects]
            .filter(p => p.status === 'ongoing')
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [projects]);
    
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="sticky top-0 z-20 w-full bg-gray-100/95 backdrop-blur-sm border-b border-gray-200">
            <div className="container mx-auto px-4 md:px-8">
                 <header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 pb-4 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                        <p className="text-gray-600">Editor Workflow</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <label htmlFor="editor-select" className="text-sm font-medium text-gray-700">Viewing as:</label>
                        <select 
                            id="editor-select"
                            value={selectedEditor} 
                            onChange={e => setSelectedEditor(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {editors.map(editor => <option key={editor} value={editor}>{editor}</option>)}
                        </select>
                    </div>
                </header>
                
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button onClick={() => setActiveTab('logHours')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'logHours' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Log Project Hours
                    </button>
                     <button onClick={() => setActiveTab('myStats')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'myStats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        My Stats
                    </button>
                    <button onClick={() => setActiveTab('teamProductivity')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'teamProductivity' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Team Productivity
                    </button>
                </nav>
            </div>
        </div>

        <main className="container mx-auto p-4 md:px-8 md:py-8">
            {activeTab === 'logHours' && <ProjectLoggerDashboard projects={allOngoingProjects} allLogs={productivityLogs} selectedEditor={selectedEditor} onUpdateProjectField={onUpdateProjectField} />}
            {activeTab === 'myStats' && <PersonalStatsView allLogs={productivityLogs} selectedEditor={selectedEditor} projects={projects} />}
            {activeTab === 'teamProductivity' && <TeamProductivityView />}
        </main>
      </div>
    );
};

const ManagerDashboard: React.FC<{
    projects: Project[];
    dailyNotesContent: string;
    productivityByProject: Record<number, Record<string, number>>;
    onAddProject: () => void;
    onUpdateProject: (id: number, field: keyof Project, value: string | number | boolean | null) => void;
    onNotesChange: (newContent: string) => void;
    onHistoricalCorrection: (projectId: number, hours: number) => Promise<void>;
    onLogout: () => void;
    isNewEditColumnMissing: boolean;
    isLoading: boolean;
}> = ({ projects, dailyNotesContent, productivityByProject, onAddProject, onUpdateProject, onNotesChange, onHistoricalCorrection, onLogout, isNewEditColumnMissing, isLoading }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [currentPage, setCurrentPage] = useState<'ongoing' | 'done' | 'all-active' | 'archived'>('ongoing');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [isNotesVisible, setIsNotesVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'default' | 'date'>('default');
    const [allActiveSortBy, setAllActiveSortBy] = useState<'client' | 'date'>('client');
    
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

    // Reset sort for All Active view when navigating away
    useEffect(() => {
        if (currentPage !== 'all-active') {
            setAllActiveSortBy('client');
        }
    }, [currentPage]);

    const handleOpenDeleteModal = useCallback((project: Project) => setProjectToDelete(project), []);
    const handleCloseDeleteModal = useCallback(() => setProjectToDelete(null), []);
    const handleConfirmDelete = useCallback(async () => {
        if (projectToDelete) {
            onUpdateProject(projectToDelete.id, 'status', 'deleted'); // This will trigger a DELETE via the main handler
            setProjectToDelete(null);
        }
    }, [projectToDelete, onUpdateProject]);

    const renderCurrentView = () => {
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
                                        onHistoricalCorrection={onHistoricalCorrection}
                                        isClientView={true}
                                        productivityBreakdown={productivityByProject?.[project.id]}
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

            if (projectsToDisplay.length === 0) {
                return <div className="text-center text-gray-500 py-10">No active projects to display.</div>;
            }

            if (allActiveSortBy === 'date') {
                const dateSortedProjects = [...projectsToDisplay].sort((a, b) => {
                    if (!a.due_date) return 1;
                    if (!b.due_date) return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                });
                return <ManagerView projects={dateSortedProjects} onUpdate={onUpdateProject} onDelete={handleOpenDeleteModal} onHistoricalCorrection={onHistoricalCorrection} isNewEditColumnMissing={isNewEditColumnMissing} productivityByProject={productivityByProject} />;
            }
            
            // Default: sort by client
            const { groupedProjects, sortedClients } = getGroupedAndSortedProjects(projectsToDisplay);

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
                                        onHistoricalCorrection={onHistoricalCorrection}
                                        isClientView={false}
                                        isNewEditColumnMissing={isNewEditColumnMissing}
                                        productivityBreakdown={productivityByProject?.[project.id]}
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

        return <ManagerView projects={projectsForView} onUpdate={onUpdateProject} onDelete={handleOpenDeleteModal} onHistoricalCorrection={onHistoricalCorrection} isNewEditColumnMissing={isNewEditColumnMissing} productivityByProject={productivityByProject} />;
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
                             <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition-transform duration-150 ease-in-out active:scale-95 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                </svg>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
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
                                {currentPage === 'all-active' && viewMode === 'manager' && (
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setAllActiveSortBy('client')} 
                                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${allActiveSortBy === 'client' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            Sort by Client
                                        </button>
                                        <button 
                                            onClick={() => setAllActiveSortBy('date')} 
                                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${allActiveSortBy === 'date' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            Sort by Date
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
    // This state uses sessionStorage to survive page reloads and avoid race conditions.
    // It reliably detects if a user has arrived from an invite link.
    const [isInviteFlow] = useState(() => {
        if (window.location.hash.includes('access_token')) {
            sessionStorage.setItem('supabase_invite_flow', 'true');
            return true;
        }
        return sessionStorage.getItem('supabase_invite_flow') === 'true';
    });
    
    const [session, setSession] = useState<Session | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [dailyNotesContent, setDailyNotesContent] = useState('');
    const [productivityLogs, setProductivityLogs] = useState<ProductivityLog[]>([]);
    const [qcProductivityLogs, setQcProductivityLogs] = useState<QCProductivityLog[]>([]);
    const [route, setRoute] = useState(window.location.pathname);
    const [isNewEditColumnMissing, setIsNewEditColumnMissing] = useState(false);
    const [isQcFeatureAvailable, setIsQcFeatureAvailable] = useState<boolean | null>(null);
    const newEditFailureDetected = useRef(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchLogs = useCallback(async () => {
        const { data, error } = await supabase.from('productivity_logs').select('*');
        if (error) console.error('Error fetching logs:', error.message);
        else setProductivityLogs(data || []);
    }, []);

    const fetchQcLogs = useCallback(async () => {
        const { data, error } = await supabase.from('qc_productivity_logs').select('*');
        if (error) console.error('Error fetching QC logs:', error.message);
        else setQcProductivityLogs(data || []);
    }, []);

    // --- DATA FETCHING & REAL-TIME SUBSCRIPTIONS ---
    useEffect(() => {
        // Probe for QC table to determine if the feature is available
        const probeForQcTable = async () => {
             // Using `head: true` is efficient; it just checks for existence without returning data.
            const { error } = await supabase.from('qc_productivity_logs').select('id', { count: 'exact', head: true });
            if (error && (error.message.includes("Could not find the table") || error.message.includes("does not exist"))) {
                console.warn("QC feature is unavailable because 'qc_productivity_logs' table is missing.");
                setIsQcFeatureAvailable(false);
            } else if (error) {
                console.error("An unexpected error occurred while checking for QC table:", error.message);
                setIsQcFeatureAvailable(false); // Fail safe on other errors
            } else {
                setIsQcFeatureAvailable(true);
            }
        };

        // Proactively check for the existence of the 'is_new_edit' column on startup.
        const probeForNewEditColumn = async () => {
            if (newEditFailureDetected.current) return;
            const { error } = await supabase.from('projects').select('is_new_edit').limit(1);
            if (error && error.message.includes("Could not find the 'is_new_edit' column")) {
                console.warn("Feature 'New Edit' is unavailable. Proactively disabling.");
                newEditFailureDetected.current = true;
                setIsNewEditColumnMissing(true);
            }
        };

        const fetchProjects = async () => {
            const { data, error } = await supabase.from('projects').select('*');
            if (error) console.error('Error fetching initial projects:', error.message);
            else {
                const augmentedData = (data || []).map(p => ({ ...p, is_new_edit: p.is_new_edit || false }));
                setProjects(augmentedData as Project[]);
            }
        };

        const fetchNotes = async () => {
            const { data, error } = await supabase.from('daily_notes').select('content').eq('id', 1).single();
            if (error) console.error('Error fetching notes:', error.message); // This will fail silently for anon users
            else setDailyNotesContent(data?.content || '');
        };
        
        const startup = async () => {
            setIsLoading(true);
            await Promise.all([
                probeForQcTable(),
                probeForNewEditColumn(),
                fetchProjects(),
                fetchNotes(),
                fetchLogs()
            ]);
            setIsLoading(false);
        };
        startup();

        // Subscribe to non-QC tables
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

        const notesChannel = supabase.channel('daily_notes')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'daily_notes', filter: 'id=eq.1' }, payload => {
            setDailyNotesContent((payload.new as { content: string }).content);
          }).subscribe();

        const logsChannel = supabase.channel('productivity_logs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'productivity_logs' }, async (payload) => {
                const newLog = payload.new as ProductivityLog;
                if (payload.eventType === 'INSERT') {
                    setProductivityLogs(current => {
                        if (current.some(l => l.id === newLog.id)) return current;
                        return [...current, newLog];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setProductivityLogs(current => {
                        const logExists = current.some(l => l.id === newLog.id);
                        if (logExists) {
                            return current.map(l => l.id === newLog.id ? newLog : l);
                        }
                        return [...current, newLog];
                    });
                } else if (payload.eventType === 'DELETE') {
                    const deletedLog = payload.old as Partial<ProductivityLog>;
                    if (deletedLog.id) {
                       setProductivityLogs(current => current.filter(l => l.id !== deletedLog.id));
                    } else {
                       fetchLogs();
                    }
                }
            }).subscribe();
        
        return () => {
            supabase.removeChannel(projectsChannel);
            supabase.removeChannel(notesChannel);
            supabase.removeChannel(logsChannel);
        };
    }, [fetchLogs]);

    // Effect for fetching and subscribing to QC data, ONLY if the feature is available.
    useEffect(() => {
        if (isQcFeatureAvailable !== true) {
            setQcProductivityLogs([]); // Ensure data is cleared if feature is disabled
            return;
        }

        fetchQcLogs();

        const qcLogsChannel = supabase.channel('qc_productivity_logs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'qc_productivity_logs' }, (payload) => {
                const newLog = payload.new as QCProductivityLog;
                if (payload.eventType === 'INSERT') {
                    setQcProductivityLogs(current => {
                        if (current.some(l => l.id === newLog.id)) return current;
                        return [...current, newLog];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setQcProductivityLogs(current => {
                        const logExists = current.some(l => l.id === newLog.id);
                        if (logExists) {
                            return current.map(l => l.id === newLog.id ? newLog : l);
                        }
                        return [...current, newLog];
                    });
                } else if (payload.eventType === 'DELETE') {
                    const deletedLog = payload.old as Partial<QCProductivityLog>;
                    if (deletedLog.id) {
                       setQcProductivityLogs(current => current.filter(l => l.id !== deletedLog.id));
                    } else {
                       fetchQcLogs();
                    }
                }
            }).subscribe();

        return () => {
            supabase.removeChannel(qcLogsChannel);
        };
    }, [isQcFeatureAvailable, fetchQcLogs]);


    const productivityByProject = useMemo(() => {
        return productivityLogs.reduce((acc, log) => {
            const { project_id, editor_name, hours_worked } = log;
            if (!acc[project_id]) {
                acc[project_id] = {};
            }
            if (!acc[project_id][editor_name]) {
                acc[project_id][editor_name] = 0;
            }
            acc[project_id][editor_name] += hours_worked;
            return acc;
        }, {} as Record<number, Record<string, number>>);
    }, [productivityLogs]);

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
        const newProjectData = { ...newProjectDataWithoutMeta };

        if (isNewEditColumnMissing) {
            delete (newProjectData as Partial<Project>).is_new_edit;
        }

        const { data: newProjectFromDb, error } = await supabase.from('projects').insert(newProjectData).select().single();
        
        if (error) {
            setProjects(currentProjects => currentProjects.filter(p => p.id !== tempId));
            console.error("Error creating project:", error);
            const errorMessage = (error && typeof error.message === 'string') ? error.message : JSON.stringify(error);
            alert(`Failed to add project: ${errorMessage}`);
            
            if (errorMessage.includes("Could not find the 'is_new_edit' column") && !isNewEditColumnMissing) {
                 setIsNewEditColumnMissing(true);
                 newEditFailureDetected.current = true;
            }
        } else if (newProjectFromDb) {
            const newProject = { ...newProjectFromDb, is_new_edit: newProjectFromDb.is_new_edit || false } as Project;
            setProjects(currentProjects => currentProjects.map(p => p.id === tempId ? newProject : p));
        }
    }, [isNewEditColumnMissing]);

    const handleUpdateProjectField = useCallback(async (id: number, field: keyof Project, value: any) => {
        if (field === 'is_new_edit' && (isNewEditColumnMissing || newEditFailureDetected.current)) {
            console.warn("Update for 'is_new_edit' blocked because the database column is missing.");
            return; 
        }

        if (field === 'total_edited') {
            console.warn("Direct updates to 'total_edited' are deprecated. It is now calculated from productivity logs.");
            return;
        }
        
        // Use a secure RPC call for updating remaining_raw from editor/QC views
        if (field === 'remaining_raw') {
            const projectForRollback = projects.find(p => p.id === id);
            if (!projectForRollback) {
                console.error(`Project with id ${id} not found for update.`);
                return;
            }
            
            // Optimistic UI update
            setProjects(currentProjects => currentProjects.map(p => p.id === id ? { ...p, remaining_raw: value } : p));

            const { error } = await supabase.rpc('update_remaining_raw', {
                project_id_in: id,
                new_value: value
            });
            
            if (error) {
                console.error(`Failed to update remaining_raw via RPC:`, error.message);
                alert(`Failed to update Remaining RAW. Error: ${error.message}. The value has been reverted.`);
                // Rollback optimistic update
                setProjects(currentProjects => currentProjects.map(p => p.id === id ? projectForRollback : p));
            }
            return; // Exit after handling RPC
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
            const errorMessage = (error && typeof error.message === 'string') ? error.message : JSON.stringify(error);
            console.error(`Failed to ${isDelete ? 'delete' : 'update'} project:`, errorMessage);

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
            
            if (errorMessage.includes("Could not find the 'is_new_edit' column")) {
                console.error("Feature 'New Edit' is unavailable. Please add a boolean column named 'is_new_edit' to your 'projects' table in Supabase.");
                if (!newEditFailureDetected.current) {
                    newEditFailureDetected.current = true;
                    setIsNewEditColumnMissing(true);
                }
            } else {
                alert(`Failed to update project: ${errorMessage}.`);
            }
        }
    }, [projects, isNewEditColumnMissing]);

    const handleHistoricalCorrection = useCallback(async (projectId: number, targetTotalHours: number) => {
        const currentNonAdjustmentHours = productivityLogs
            .filter(log => log.project_id === projectId && log.editor_name !== 'Historical Adjustment')
            .reduce((sum, log) => sum + log.hours_worked, 0);
        
        const adjustmentValue = targetTotalHours - currentNonAdjustmentHours;

        const { error: deleteError } = await supabase
            .from('productivity_logs')
            .delete()
            .match({ project_id: projectId, editor_name: 'Historical Adjustment' });

        if (deleteError) {
            alert(`Failed to clear previous adjustment: ${deleteError.message}`);
            return;
        }
        
        const adjustmentLog: Omit<ProductivityLog, 'id'> = {
            project_id: projectId,
            editor_name: 'Historical Adjustment',
            date: '2000-01-01',
            hours_worked: adjustmentValue,
        };

        const { data: newLog, error: insertError } = await supabase
            .from('productivity_logs')
            .insert(adjustmentLog)
            .select()
            .single();

        if (insertError) {
            alert(`Failed to save new adjustment: ${insertError.message}`);
            fetchLogs();
            return;
        }
        
        if (newLog) {
            setProductivityLogs(currentLogs => [
                ...currentLogs.filter(log => !(log.project_id === projectId && log.editor_name === 'Historical Adjustment')),
                newLog,
            ]);
        } else {
            console.warn('Historical adjustment saved, but could not retrieve the new record. Refetching logs.');
            fetchLogs();
        }
    }, [productivityLogs, fetchLogs]);


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

    const handleLogout = () => {
        supabase.auth.signOut();
    };

    // Helper for debouncing
    function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
      let timeout: ReturnType<typeof setTimeout> | null = null;
      return (...args: Parameters<F>): void => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), waitFor);
      };
    }
    
    // --- RENDER LOGIC ---

    if (route === '/editor' || route === '/editor.html') {
        if (isLoading) {
            return <div className="flex items-center justify-center h-screen"><p>Loading Dashboard...</p></div>;
        }
        return <EditorDashboard projects={projects} productivityLogs={productivityLogs} onUpdateProjectField={handleUpdateProjectField} />;
    }
    
    if (route === '/qc' || route === '/qc.html') {
        if (isLoading || isQcFeatureAvailable === null) {
            return <div className="flex items-center justify-center h-screen"><p>Loading QC Dashboard...</p></div>;
        }
        if (isQcFeatureAvailable === false) {
             return (
                <div className="flex items-center justify-center min-h-screen bg-gray-100">
                    <div className="p-8 bg-white rounded-lg shadow-md text-center max-w-lg">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">QC Feature Unavailable</h1>
                        <p className="text-gray-700">The QC dashboard cannot be loaded because the required database table (<code className="bg-gray-200 p-1 rounded text-sm">qc_productivity_logs</code>) is missing.</p>
                        <p className="text-gray-600 mt-4">To enable this feature, please run the SQL script provided during setup to create the table.</p>
                    </div>
                </div>
            );
        }
        return <QCDashboard projects={projects} qcLogs={qcProductivityLogs} />;
    }

    // If the user has a session AND we know they started from an invite link,
    // force them to set a password.
    if (session && isInviteFlow) {
        return <SetPassword />;
    }

    // If there's no session, show the login page.
    if (!session) {
        return <Auth />;
    }

    // Otherwise, the user is fully authenticated, show the main dashboard.
    return <ManagerDashboard projects={projects} dailyNotesContent={dailyNotesContent} onAddProject={handleAddNewProject} onUpdateProject={handleUpdateProjectField} onNotesChange={handleNotesChange} onHistoricalCorrection={handleHistoricalCorrection} onLogout={handleLogout} isNewEditColumnMissing={isNewEditColumnMissing} isLoading={isLoading} productivityByProject={productivityByProject} />;
};

export default App;