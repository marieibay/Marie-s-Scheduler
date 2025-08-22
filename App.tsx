import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Project, ViewMode } from './types';
import { initialProjects } from './data';

// --- HELPER FUNCTIONS ---
const getClientName = (project: Project): string => {
    const title = project.title.toUpperCase();
    if (title.startsWith('AUDIBLE:')) return 'AUDIBLE';
    if (title.startsWith('PODIUM:')) return 'PODIUM';
    if (title.startsWith('CURATED')) return 'CURATED AUDIO';
    if (title.startsWith('HAY HOUSE:')) return 'HAY HOUSE';
    if (title.startsWith('ONS:')) return 'ONS';
    if (title.startsWith('ANATOLE')) return 'ANATOLE';
    if (title.startsWith('BLOOMSBURY')) return 'Bloomsbury';
    if (title.startsWith('PRHA#:')) return 'PRH';
    // Per user instruction, if no specific client is mentioned, it's PRH.
    return 'PRH';
};


const calculateWhatsLeft = (estRt: number, totalEdited: number): string => {
    const result = (estRt || 0) - (totalEdited || 0);
    return result.toFixed(2);
};

// --- STYLING CONSTANTS ---
const INLINE_INPUT_CLASS = "bg-transparent focus:bg-white w-full p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors duration-200";

// --- ICON COMPONENTS ---
const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);


// --- CHILD COMPONENTS ---

// Project Card for Manager and Client Views
interface ProjectCardProps {
    project: Project;
    onUpdate: (id: number, field: keyof Project, value: string | number) => void;
    isDraggable: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, project: Project) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>, project: Project) => void;
    isDraggingOver?: boolean;
}


const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, isDraggable, onDragStart, onDragOver, onDragLeave, onDrop, isDraggingOver }) => {
    const whatsLeft = calculateWhatsLeft(project.estRt, project.totalEdited);
    
    const handleUpdate = (field: keyof Project, value: string | number) => {
        onUpdate(project.id, field, value);
    };

    const handleNumberUpdate = (field: keyof Project, value: string) => {
        onUpdate(project.id, field, parseFloat(value) || 0);
    };

    return (
        <div
            className={`card bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row items-start md:items-center gap-4 hover:shadow-lg transition-all duration-300 ${isDraggable ? 'cursor-grab' : ''} ${isDraggingOver ? 'drag-over-active' : ''}`}
            draggable={isDraggable}
            onDragStart={(e) => isDraggable && onDragStart?.(e, project)}
            onDragOver={(e) => isDraggable && onDragOver?.(e)}
            onDragLeave={(e) => isDraggable && onDragLeave?.(e)}
            onDrop={(e) => isDraggable && onDrop?.(e, project)}
            data-id={project.id}
        >
            <div className="flex-grow flex flex-col md:flex-row md:items-center gap-4 w-full">
                <div className="flex-1 min-w-0">
                    <input type="text" value={project.title} onChange={(e) => handleUpdate('title', e.target.value)} className={`font-bold text-md lg:text-lg text-gray-800 truncate ${INLINE_INPUT_CLASS}`} placeholder="Project Title" />
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span>Due:</span>
                        <input type="date" value={project.dueDate} onChange={(e) => handleUpdate('dueDate', e.target.value)} className={`font-bold text-red-600 ${INLINE_INPUT_CLASS} w-auto ml-1`}/>
                    </div>
                    <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-200">
                         <textarea
                            value={project.notes}
                            onChange={(e) => handleUpdate('notes', e.target.value)}
                            rows={2}
                            placeholder="Notes..."
                            className={`w-full resize-none ${INLINE_INPUT_CLASS}`}
                         />
                    </div>
                </div>
                <div className="hidden xl:flex flex-col text-sm space-y-2 w-full md:w-auto md:max-w-[200px] text-gray-600">
                    <div className="flex items-center"><strong className="w-16 flex-shrink-0">Editor:</strong><input type="text" value={project.editor} onChange={(e) => handleUpdate('editor', e.target.value)} className={INLINE_INPUT_CLASS} /></div>
                    <div className="flex items-center"><strong className="w-16 flex-shrink-0">Master:</strong><input type="text" value={project.master} onChange={(e) => handleUpdate('master', e.target.value)} className={INLINE_INPUT_CLASS} /></div>
                    <div className="flex items-center"><strong className="w-16 flex-shrink-0">PZ QC:</strong><input type="text" value={project.pzQc} onChange={(e) => handleUpdate('pzQc', e.target.value)} className={INLINE_INPUT_CLASS} /></div>
                </div>
            </div>
            <div className="flex items-center gap-2 text-center text-sm w-full md:w-auto justify-around md:justify-end mt-4 md:mt-0">
                <div className="bg-blue-50 p-2 rounded-lg w-24">
                    <input type="number" step="0.01" value={project.estRt} onChange={(e) => handleNumberUpdate('estRt', e.target.value)} className={`font-semibold text-blue-800 text-center ${INLINE_INPUT_CLASS}`}/>
                    <p className="text-xs text-blue-600 mt-1">EST RT</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-lg w-24">
                    <input type="number" step="0.01" value={project.totalEdited} onChange={(e) => handleNumberUpdate('totalEdited', e.target.value)} className={`font-semibold text-yellow-800 text-center ${INLINE_INPUT_CLASS}`}/>
                    <p className="text-xs text-yellow-600 mt-1">Edited</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg w-24">
                    <p className="font-semibold text-green-800 h-6 flex items-center justify-center">{whatsLeft} hrs</p>
                    <p className="text-xs text-green-600 mt-1">What's Left</p>
                </div>
            </div>
        </div>
    );
};


// Manager View Component
interface ManagerViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: string | number) => void;
    onReorder: (draggedId: number, targetId: number) => void;
}

const ManagerView: React.FC<ManagerViewProps> = ({ projects, onUpdate, onReorder }) => {
    const [draggedItem, setDraggedItem] = useState<Project | null>(null);
    const [draggedOverItem, setDraggedOverItem] = useState<Project | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, project: Project) => {
        const targetNodeName = (e.target as HTMLElement).nodeName.toLowerCase();
        if (['input', 'textarea'].includes(targetNodeName)) {
            e.preventDefault();
            return;
        }
        setDraggedItem(project);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('dragging');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const targetId = Number(e.currentTarget.dataset.id);
        if (draggedItem && targetId !== draggedItem.id) {
            const project = projects.find(p => p.id === targetId);
            if (project) setDraggedOverItem(project);
        }
    };
    
    const handleDragLeave = () => {
        setDraggedOverItem(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetProject: Project) => {
        if (draggedItem) {
            onReorder(draggedItem.id, targetProject.id);
        }
        e.currentTarget.closest('.card')?.classList.remove('dragging');
        setDraggedItem(null);
        setDraggedOverItem(null);
    };

    return (
        <main>
            <div className="space-y-4">
                {projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onUpdate={onUpdate}
                        isDraggable={true}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        isDraggingOver={draggedOverItem?.id === project.id}
                    />
                ))}
            </div>
        </main>
    );
};

// Client View Component
interface ClientViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: string | number) => void;
}

const ClientView: React.FC<ClientViewProps> = ({ projects, onUpdate }) => {
    const groupedProjects = useMemo(() => {
        const groups = projects.reduce((acc, project) => {
            const client = getClientName(project);
            if (!acc[client]) {
                acc[client] = [];
            }
            acc[client].push(project);
            return acc;
        }, {} as Record<string, Project[]>);
        return groups;
    }, [projects]);

    const clientOrder = useMemo(() => {
        const clients = Object.keys(groupedProjects);
        return clients.sort((a, b) => {
            if (a === 'PRH') return -1;
            if (b === 'PRH') return 1;
            return a.localeCompare(b);
        });
    }, [groupedProjects]);

    return (
        <main className="space-y-8">
            {clientOrder.map(clientName => (
                <div key={clientName}>
                    <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-200 text-gray-800">{clientName}</h2>
                    <div className="space-y-4">
                        {groupedProjects[clientName].map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onUpdate={onUpdate}
                                isDraggable={false}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </main>
    );
};


// Editor Row for Editor View
interface EditorRowProps {
    project: Project;
    onUpdate: (id: number, field: keyof Project, value: string | number) => void;
}

const EditorRow: React.FC<EditorRowProps> = ({ project, onUpdate }) => {
    const whatsLeft = calculateWhatsLeft(project.estRt, project.totalEdited);
    
    const handleInputChange = (field: keyof Project, value: string) => {
        const numValue = parseFloat(value) || 0;
        onUpdate(project.id, field, numValue);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-center p-3 border-b border-gray-200">
            <div className="col-span-2 md:col-span-3">
                <input type="text" value={project.title} onChange={(e) => onUpdate(project.id, 'title', e.target.value)} className={`font-semibold text-gray-800 ${INLINE_INPUT_CLASS}`} placeholder="Project Title" />
                <div className="flex items-center text-sm text-gray-500 mt-1">
                    Due: 
                    <input type="date" value={project.dueDate} onChange={(e) => onUpdate(project.id, 'dueDate', e.target.value)} className={`font-bold text-red-600 ${INLINE_INPUT_CLASS} w-auto mx-1`} />
                    | Editor: 
                    <input type="text" value={project.editor} onChange={(e) => onUpdate(project.id, 'editor', e.target.value)} className={`${INLINE_INPUT_CLASS} w-auto ml-1`} placeholder="Editor"/>
                </div>
            </div>
            <div className="text-center">
                <label className="text-xs text-gray-500 block text-center mb-1">EST RT</label>
                <input
                    type="number" step="0.01" value={project.estRt}
                    onChange={(e) => handleInputChange('estRt', e.target.value)}
                    className={`editor-input w-full border-gray-300 rounded-md shadow-sm text-center p-1`}
                />
            </div>
            <div>
                <label className="text-xs text-gray-500 block text-center mb-1">Total Edited</label>
                <input
                    type="number" step="0.01" value={project.totalEdited}
                    onChange={(e) => handleInputChange('totalEdited', e.target.value)}
                    className="editor-input w-full border-gray-300 rounded-md shadow-sm text-center p-1"
                />
            </div>
            <div className="text-center bg-gray-50 p-2 rounded-lg">
                <p className="font-medium">{whatsLeft}</p>
                <p className="text-xs text-gray-500">What's Left</p>
            </div>
        </div>
    );
};


// Editor View Component
interface EditorViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: string | number) => void;
}

const EditorView: React.FC<EditorViewProps> = ({ projects, onUpdate }) => {
    return (
        <main>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Editor Entries</h2>
                <div className="space-y-2">
                    {projects.map(project => (
                        <EditorRow key={project.id} project={project} onUpdate={onUpdate} />
                    ))}
                </div>
            </div>
        </main>
    );
};

// Project Modal Component
interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (project: Omit<Project, 'id'> & { id?: number }) => void;
    project: Project | null;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, project }) => {
    const [formData, setFormData] = useState<Omit<Project, 'id'>>({
        title: '', dueDate: '', notes: '', editor: '', pzQc: '', master: '', estRt: 0, totalEdited: 0
    });
    
    const modalRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (project) { 
            setFormData({
                title: project.title, dueDate: project.dueDate, notes: project.notes, editor: project.editor,
                pzQc: project.pzQc, master: project.master, estRt: project.estRt, totalEdited: project.totalEdited,
            });
        } else { // For new project
             setFormData({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '', editor: '', pzQc: '', master: '', estRt: 0, totalEdited: 0 });
        }
    }, [project, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: project?.id });
    };
    
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && e.target === modalRef.current) {
            onClose();
        }
    }

    return (
        <div ref={modalRef} onClick={handleBackdropClick} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">{project ? 'Edit Project' : 'Add New Project'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" id="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                        <div>
                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input type="date" id="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Recording Schedule / Notes</label>
                        <textarea id="notes" rows={3} value={formData.notes} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="editor" className="block text-sm font-medium text-gray-700">Editor</label>
                            <input type="text" id="editor" value={formData.editor} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="pzQc" className="block text-sm font-medium text-gray-700">PZ QC</label>
                            <input type="text" id="pzQc" value={formData.pzQc} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="master" className="block text-sm font-medium text-gray-700">Master</label>
                            <input type="text" id="master" value={formData.master} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="estRt" className="block text-sm font-medium text-gray-700">EST RT (hrs)</label>
                            <input type="number" step="0.01" id="estRt" value={formData.estRt} onChange={handleNumberChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="totalEdited" className="block text-sm font-medium text-gray-700">Total Edited (hrs)</label>
                            <input type="number" step="0.01" id="totalEdited" value={formData.totalEdited} onChange={handleNumberChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">Save Project</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);

    const sortedProjects = useMemo(() => {
        return [...projects].sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
            const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
            if (dateA === 0 && dateB === 0) return 0;
            if (dateA === 0) return 1;
            if (dateB === 0) return -1;
            return dateA - dateB;
        });
    }, [projects]);

    const handleSwitchView = (mode: ViewMode) => setViewMode(mode);

    const handleOpenModalForNew = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProject(null);
    };
    
    const handleSaveProject = useCallback((projectData: Omit<Project, 'id'> & { id?: number }) => {
        setProjects(prevProjects => {
            if (projectData.id) { 
                return prevProjects.map(p => p.id === projectData.id ? { ...p, ...projectData, id: projectData.id } : p);
            } else { 
                const newProject: Project = { ...projectData, id: Date.now() };
                return [...prevProjects, newProject];
            }
        });
        handleCloseModal();
    }, []);

    const handleUpdateProjectField = useCallback((id: number, field: keyof Project, value: string | number) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, []);
    
    const handleReorderProjects = useCallback((draggedId: number, targetId: number) => {
        setProjects(currentProjects => {
            const draggedIndex = currentProjects.findIndex(p => p.id === draggedId);
            const targetIndex = currentProjects.findIndex(p => p.id === targetId);

            if (draggedIndex === -1 || targetIndex === -1) return currentProjects;
            
            const newProjects = [...currentProjects];
            const [draggedItem] = newProjects.splice(draggedIndex, 1);
            newProjects.splice(targetIndex, 0, draggedItem);
            
            return newProjects;
        });
    }, []);

    const renderCurrentView = () => {
        switch (viewMode) {
            case 'manager':
                return <ManagerView projects={projects} onUpdate={handleUpdateProjectField} onReorder={handleReorderProjects} />;
            case 'client':
                return <ClientView projects={sortedProjects} onUpdate={handleUpdateProjectField} />;
            case 'editor':
                return <EditorView projects={sortedProjects} onUpdate={handleUpdateProjectField} />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                    <p className="text-gray-600">Manage your post-production workflow.</p>
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                    <div className="flex items-center space-x-1 sm:space-x-2 bg-white p-2 rounded-lg shadow-sm">
                        <span className="text-sm font-medium hidden sm:block">View Mode:</span>
                        <button onClick={() => handleSwitchView('manager')} className={`px-3 py-1 rounded-md text-sm shadow transition-colors ${viewMode === 'manager' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Manager</button>
                        <button onClick={() => handleSwitchView('client')} className={`px-3 py-1 rounded-md text-sm shadow transition-colors ${viewMode === 'client' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Client</button>
                        <button onClick={() => handleSwitchView('editor')} className={`px-3 py-1 rounded-md text-sm shadow transition-colors ${viewMode === 'editor' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Editor</button>
                    </div>
                    {viewMode === 'manager' && (
                        <button onClick={handleOpenModalForNew} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center">
                            <PlusIcon />
                            <span className="hidden sm:inline">Add Project</span>
                        </button>
                    )}
                </div>
            </header>

            {renderCurrentView()}

            <ProjectModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveProject} project={editingProject} />
        </div>
    );
};

export default App;