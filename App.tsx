
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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

const WarningIconRed: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const WarningIconYellow: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
    </svg>
);

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4.75 8.5a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H4.75z" clipRule="evenodd" />
    </svg>
);


// --- CHILD COMPONENTS ---

// Due Date Display with Alerts
interface DueDateDisplayProps {
    dueDate: string;
    onUpdate: (newDate: string) => void;
}

const DueDateDisplay: React.FC<DueDateDisplayProps> = ({ dueDate, onUpdate }) => {
    const dateInputRef = useRef<HTMLInputElement>(null);

    const handleIconClick = () => {
        dateInputRef.current?.showPicker();
    };

    const alertIcon = useMemo(() => {
        if (!dueDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Use a more robust date parsing that accounts for timezones
        const dueDateObj = new Date(dueDate + 'T00:00:00');
        if (isNaN(dueDateObj.getTime())) return null;

        dueDateObj.setHours(0, 0, 0, 0);

        const timeDiff = dueDateObj.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (dayDiff <= 0) { // Due today or overdue
            return <WarningIconRed />;
        } else if (dayDiff <= 7) { // Due within the next 7 days
            return <WarningIconYellow />;
        }
        return null;
    }, [dueDate]);
    
    const formattedDate = useMemo(() => {
        if (!dueDate) return 'N/A';
        try {
            const date = new Date(dueDate + 'T00:00:00'); // To avoid timezone issues
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${month}-${day}-${year}`;
        } catch (e) {
            return 'Invalid Date';
        }
    }, [dueDate]);

    return (
        <div className="relative flex items-center gap-2">
            <span className="text-sm text-gray-600">Due:</span>
            <span className="font-bold text-red-600 text-lg w-[75px]">{formattedDate}</span>
            <button
                type="button"
                onClick={handleIconClick}
                className="p-1 -ml-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
                aria-label="Change due date"
            >
                <CalendarIcon />
            </button>
            <input
                ref={dateInputRef}
                type="date"
                value={dueDate}
                onChange={(e) => onUpdate(e.target.value)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                tabIndex={-1}
            />
            <div className="w-5 h-5 flex items-center justify-center">{alertIcon}</div>
        </div>
    );
};

// Rich Text Input for Notes
interface RichTextInputProps {
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
}

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
        const newHTML = e.currentTarget.innerHTML;
        if (newHTML !== valueRef.current) {
            onChange(newHTML);
        }
    }, [onChange]);
    
    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);
    
    const handleBlur = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
        // If focus moves outside the component, hide the toolbar
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsFocused(false);
        }
        
        // Also handle the content update on blur to catch final changes
        const newHTML = e.currentTarget.innerHTML;
        if (newHTML !== valueRef.current) {
            onChange(newHTML);
        }
    }, [onChange]);


    const execCmd = (command: string, val?: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, val);
            onChange(editorRef.current.innerHTML); // Update state immediately after command
        }
    };
    
    const isEffectivelyEmpty = !value || value.replace(/<[^>]*>?/gm, '').trim().length === 0;

    return (
        <div 
            className="relative bg-white border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500"
            onFocus={handleFocus}
            onBlur={handleBlur}
        >
            {isFocused && (
                <div className="flex flex-wrap items-center p-1 bg-gray-50 border-b border-gray-200 rounded-t-md space-x-2">
                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('bold')} className="px-2 py-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-bold" title="Bold">B</button>
                    
                    <div className="flex items-center space-x-1 border-l pl-2 ml-1">
                        <span className="text-sm text-gray-600 mr-1">Size:</span>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('fontSize', '2')} className="px-2 py-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-xs" title="Small">S</button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('fontSize', '4')} className="px-2 py-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-base" title="Medium">M</button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('fontSize', '6')} className="px-2 py-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400 text-lg" title="Large">L</button>
                    </div>
                    
                    <div className="flex items-center space-x-1 border-l pl-2 ml-1">
                        <span className="text-sm text-gray-600 mr-1">Color:</span>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('foreColor', '#1f2937')} className="p-1 rounded-full hover:bg-gray-200" title="Black"><span className="block w-4 h-4 rounded-full border bg-gray-800"></span></button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('foreColor', '#ef4444')} className="p-1 rounded-full hover:bg-gray-200" title="Red"><span className="block w-4 h-4 rounded-full border bg-red-500"></span></button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('foreColor', '#3b82f6')} className="p-1 rounded-full hover:bg-gray-200" title="Blue"><span className="block w-4 h-4 rounded-full border bg-blue-500"></span></button>
                        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => execCmd('foreColor', '#22c55e')} className="p-1 rounded-full hover:bg-gray-200" title="Green"><span className="block w-4 h-4 rounded-full border bg-green-500"></span></button>
                    </div>
                </div>
            )}
            <div className="relative p-2 min-h-[60px]">
                 {isEffectivelyEmpty && !isFocused && (
                     <div className="absolute top-2 left-2 text-gray-400 pointer-events-none select-none">{placeholder}</div>
                )}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="w-full h-full focus:outline-none"
                    spellCheck="false"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            </div>
        </div>
    );
};

// Project Card for Manager and Client Views
interface ProjectCardProps {
    project: Project;
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
    isDraggable: boolean;
    onDragStart?: (e: React.DragEvent<HTMLDivElement>, project: Project) => void;
    onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLDivElement>, project: Project) => void;
    isDraggingOver?: boolean;
}


const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, isDraggable, onDragStart, onDragOver, onDragLeave, onDrop, isDraggingOver }) => {
    const whatsLeft = calculateWhatsLeft(project.estRt, project.totalEdited);
    
    const handleUpdate = (field: keyof Project, value: string | number | boolean) => {
        onUpdate(project.id, field, value);
    };

    const handleNumberUpdate = (field: keyof Project, value: string) => {
        onUpdate(project.id, field, parseFloat(value) || 0);
    };

    return (
        <div
            className={`card p-4 rounded-lg shadow-md flex flex-col xl:flex-row items-start gap-4 hover:shadow-lg transition-all duration-300 ${isDraggable ? 'cursor-grab' : ''} ${isDraggingOver ? 'drag-over-active' : ''} ${project.isOnHold ? 'bg-pink-100 border border-pink-300' : 'bg-white'}`}
            draggable={isDraggable}
            onDragStart={(e) => isDraggable && onDragStart?.(e, project)}
            onDragOver={(e) => isDraggable && onDragOver?.(e)}
            onDragLeave={(e) => isDraggable && onDragLeave?.(e)}
            onDrop={(e) => isDraggable && onDrop?.(e, project)}
            data-id={project.id}
        >
            {/* Title, Due Date & Notes */}
            <div className="flex-1 w-full min-w-0">
                 <div className="flex justify-between items-start gap-4">
                    <input type="text" value={project.title} onChange={(e) => handleUpdate('title', e.target.value)} className={`font-bold text-md lg:text-lg text-gray-800 truncate ${INLINE_INPUT_CLASS}`} placeholder="Project Title" />
                     <button
                        onClick={() => handleUpdate('isOnHold', !project.isOnHold)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm transition-colors whitespace-nowrap ${
                            project.isOnHold
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {project.isOnHold ? 'On Hold' : 'Set Hold'}
                    </button>
                </div>
                <div className="mt-1">
                    <DueDateDisplay
                        dueDate={project.dueDate}
                        onUpdate={(newDate) => handleUpdate('dueDate', newDate)}
                    />
                </div>
                <div className="mt-4">
                    <RichTextInput 
                        value={project.notes}
                        onChange={(newNotes) => handleUpdate('notes', newNotes)}
                        placeholder="Notes..."
                    />
                </div>
            </div>

            {/* Editor, Master, QC */}
            <div className="w-full xl:w-auto xl:max-w-md">
                 <div className="grid grid-cols-[auto_1fr_1.5fr] gap-x-2 gap-y-2 items-center text-sm text-gray-600">
                    <strong className="text-right">Editor:</strong>
                    <input type="text" value={project.editor} onChange={(e) => handleUpdate('editor', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Name..."/>
                    <input type="text" value={project.editorNote} onChange={(e) => handleUpdate('editorNote', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/>

                    <strong className="text-right">Master:</strong>
                    <input type="text" value={project.master} onChange={(e) => handleUpdate('master', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Name..."/>
                    <input type="text" value={project.masterNote} onChange={(e) => handleUpdate('masterNote', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/>
                    
                    <strong className="text-right">PZ QC:</strong>
                    <input type="text" value={project.pzQc} onChange={(e) => handleUpdate('pzQc', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Name..."/>
                    <input type="text" value={project.pzQcNote} onChange={(e) => handleUpdate('pzQcNote', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/>
                 </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-center text-sm w-full md:w-auto justify-around xl:justify-end mt-4 xl:mt-0">
                <div className="bg-blue-50 p-2 rounded-lg w-24">
                    <input type="number" step="0.01" value={project.estRt} onChange={(e) => handleNumberUpdate('estRt', e.target.value)} className={`font-semibold text-blue-800 text-center ${INLINE_INPUT_CLASS}`}/>
                    <p className="text-xs text-blue-600 mt-1">EST RT</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-lg w-24">
                    <input type="number" step="0.01" value={project.totalEdited} onChange={(e) => handleNumberUpdate('totalEdited', e.target.value)} className={`font-bold text-lg text-yellow-800 text-center ${INLINE_INPUT_CLASS}`}/>
                    <p className="text-sm font-medium text-yellow-600 mt-1">Edited</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg w-24">
                    <p className="font-semibold text-green-800 h-6 flex items-center justify-center">{whatsLeft} hrs</p>
                    <p className="text-xs text-green-600 mt-1">What's Left</p>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg w-24">
                    <input type="number" step="0.01" value={project.remainingRaw} onChange={(e) => handleNumberUpdate('remainingRaw', e.target.value)} className={`font-bold text-lg text-purple-800 text-center ${INLINE_INPUT_CLASS}`}/>
                    <p className="text-sm font-medium text-purple-600 mt-1">Remaining RAW</p>
                </div>
            </div>
        </div>
    );
};


// Manager View Component
interface ManagerViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
    onReorder: (draggedId: number, targetId: number) => void;
}

const ManagerView: React.FC<ManagerViewProps> = ({ projects, onUpdate, onReorder }) => {
    const [draggedItem, setDraggedItem] = useState<Project | null>(null);
    const [draggedOverItem, setDraggedOverItem] = useState<Project | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, project: Project) => {
        const targetNodeName = (e.target as HTMLElement).nodeName.toLowerCase();
        if (['input', 'textarea', 'button'].includes(targetNodeName) || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[contenteditable]')) {
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
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
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
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
}

const EditorRow: React.FC<EditorRowProps> = ({ project, onUpdate }) => {
    const whatsLeft = calculateWhatsLeft(project.estRt, project.totalEdited);
    
    const handleInputChange = (field: keyof Project, value: string) => {
        const numValue = parseFloat(value) || 0;
        onUpdate(project.id, field, numValue);
    };

    return (
        <div className={`grid grid-cols-2 md:grid-cols-8 gap-4 items-center p-3 border-b border-gray-200 ${project.isOnHold ? 'bg-pink-50' : ''}`}>
            <div className="col-span-2 md:col-span-3">
                <input type="text" value={project.title} onChange={(e) => onUpdate(project.id, 'title', e.target.value)} className={`font-semibold text-gray-800 ${INLINE_INPUT_CLASS}`} placeholder="Project Title" />
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-x-2">
                    <DueDateDisplay
                        dueDate={project.dueDate}
                        onUpdate={(newDate) => onUpdate(project.id, 'dueDate', newDate)}
                    />
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center">
                        Editor:
                        <input type="text" value={project.editor} onChange={(e) => onUpdate(project.id, 'editor', e.target.value)} className={`${INLINE_INPUT_CLASS} w-24 ml-1`} placeholder="Name"/>
                        <input type="text" value={project.editorNote} onChange={(e) => onUpdate(project.id, 'editorNote', e.target.value)} className={`${INLINE_INPUT_CLASS} flex-grow ml-1`} placeholder="Note..."/>
                    </span>
                </div>
            </div>
            <div className="text-center">
                <label className="text-xs text-gray-500 block text-center mb-1">EST RT</label>
                <input
                    type="number" step="0.01" value={project.estRt}
                    onChange={(e) => handleInputChange('estRt', e.target.value)}
                    className={`w-full border-gray-300 rounded-md shadow-sm text-center p-1`}
                />
            </div>
            <div>
                <label className="text-xs text-gray-500 block text-center mb-1">Total Edited</label>
                <input
                    type="number" step="0.01" value={project.totalEdited}
                    onChange={(e) => handleInputChange('totalEdited', e.target.value)}
                    className="font-bold text-lg w-full border-gray-300 rounded-md shadow-sm text-center p-1"
                />
            </div>
            <div className="text-center bg-gray-50 p-2 rounded-lg">
                <p className="font-medium">{whatsLeft}</p>
                <p className="text-xs text-gray-500">What's Left</p>
            </div>
             <div>
                <label className="text-xs text-gray-500 block text-center mb-1">Remaining RAW</label>
                <input
                    type="number" step="0.01" value={project.remainingRaw}
                    onChange={(e) => handleInputChange('remainingRaw', e.target.value)}
                    className="font-bold text-lg w-full border-gray-300 rounded-md shadow-sm text-center p-1"
                />
            </div>
             <div className="text-center">
                 <button
                    onClick={() => onUpdate(project.id, 'isOnHold', !project.isOnHold)}
                    className={`px-2 py-1.5 text-xs font-semibold rounded-md shadow-sm transition-colors w-full ${
                        project.isOnHold
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    {project.isOnHold ? 'On Hold' : 'Set Hold'}
                </button>
            </div>
        </div>
    );
};


// Editor View Component
interface EditorViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
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
        title: '', dueDate: '', notes: '', editor: '', editorNote: '', pzQc: '', pzQcNote: '', master: '', masterNote: '', estRt: 0, totalEdited: 0, remainingRaw: 0, isOnHold: false,
    });
    
    const modalRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (project) { 
            setFormData({
                title: project.title, dueDate: project.dueDate, notes: project.notes,
                editor: project.editor, editorNote: project.editorNote || '',
                pzQc: project.pzQc, pzQcNote: project.pzQcNote || '',
                master: project.master, masterNote: project.masterNote || '',
                estRt: project.estRt, totalEdited: project.totalEdited,
                remainingRaw: project.remainingRaw || 0,
                isOnHold: project.isOnHold || false,
            });
        } else { // For new project
             setFormData({ title: '', dueDate: new Date().toISOString().split('T')[0], notes: '', editor: '', editorNote: '', pzQc: '', pzQcNote: '', master: '', masterNote: '', estRt: 0, totalEdited: 0, remainingRaw: 0, isOnHold: false });
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
                     <div className="flex items-center mt-2">
                        <input
                            type="checkbox"
                            id="isOnHold"
                            checked={formData.isOnHold}
                            onChange={(e) => setFormData(prev => ({...prev, isOnHold: e.target.checked}))}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="isOnHold" className="ml-2 block text-sm font-medium text-gray-900">
                           Mark project as "On Hold"
                        </label>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Recording Schedule / Notes</label>
                        <RichTextInput 
                           value={formData.notes}
                           onChange={(newNotes) => setFormData(prev => ({...prev, notes: newNotes}))}
                           placeholder="Enter notes here..."
                        />
                    </div>

                    <div className="space-y-4">
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="editor" className="block text-sm font-medium text-gray-700">Editor</label>
                                <input type="text" id="editor" value={formData.editor} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="editorNote" className="block text-sm font-medium text-gray-700">Editor Note</label>
                                <input type="text" id="editorNote" value={formData.editorNote} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </fieldset>
                         <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="master" className="block text-sm font-medium text-gray-700">Master</label>
                                <input type="text" id="master" value={formData.master} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="masterNote" className="block text-sm font-medium text-gray-700">Master Note</label>
                                <input type="text" id="masterNote" value={formData.masterNote} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </fieldset>
                        <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pzQc" className="block text-sm font-medium text-gray-700">PZ QC</label>
                                <input type="text" id="pzQc" value={formData.pzQc} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                             <div>
                                <label htmlFor="pzQcNote" className="block text-sm font-medium text-gray-700">PZ QC Note</label>
                                <input type="text" id="pzQcNote" value={formData.pzQcNote} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </fieldset>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="estRt" className="block text-sm font-medium text-gray-700">EST RT (hrs)</label>
                            <input type="number" step="0.01" id="estRt" value={formData.estRt} onChange={handleNumberChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="totalEdited" className="block text-sm font-medium text-gray-700">Total Edited (hrs)</label>
                            <input type="number" step="0.01" id="totalEdited" value={formData.totalEdited} onChange={handleNumberChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="remainingRaw" className="block text-sm font-medium text-gray-700">Remaining RAW (hrs)</label>
                            <input type="number" step="0.01" id="remainingRaw" value={formData.remainingRaw} onChange={handleNumberChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" />
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
        if (viewMode === 'manager') {
            return projects;
        }
        return [...projects].sort((a, b) => {
            const dateA = a.dueDate ? new Date(a.dueDate) : null;
            const dateB = b.dueDate ? new Date(b.dueDate) : null;
    
            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;
    
            const timeA = dateA.getTime();
            const timeB = dateB.getTime();
            
            if (isNaN(timeA) && isNaN(timeB)) return 0;
            if (isNaN(timeA)) return 1;
            if (isNaN(timeB)) return -1;
            
            return timeA - timeB;
        });
    }, [projects, viewMode]);


    const handleSwitchView = (mode: ViewMode) => setViewMode(mode);

    const handleOpenModalForNew = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingProject(null);
    }, []);
    
    const handleSaveProject = useCallback((projectData: Omit<Project, 'id'> & { id?: number }) => {
        setProjects(prevProjects => {
            if (projectData.id) { 
                return prevProjects.map(p => p.id === projectData.id ? { ...p, ...projectData, id: projectData.id } : p);
            } else { 
                const newProject: Project = { ...projectData, id: Date.now() };
                return [newProject, ...prevProjects];
            }
        });
        handleCloseModal();
    }, [handleCloseModal]);

    const handleUpdateProjectField = useCallback((id: number, field: keyof Project, value: string | number | boolean) => {
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
        const projectsToDisplay = viewMode === 'manager' ? projects : sortedProjects;
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