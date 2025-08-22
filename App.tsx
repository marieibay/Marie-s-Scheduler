
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Project, ViewMode } from './types';
import { initialProjects } from './data';
import { editors, masters, qcPersonnel } from './employees';

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

const TrashIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const CalendarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);


// --- CHILD COMPONENTS ---

// Delete Confirmation Modal
interface DeleteConfirmationModalProps {
    projectTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ projectTitle, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Project</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete the project "{projectTitle}"? This action cannot be undone.
                    </p>
                </div>
                <div className="items-center px-4 py-3 space-x-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Due Date Display with Alerts
interface DueDateDisplayProps {
    dueDate: string;
    originalDueDate: string;
    onUpdate: (newDate: string) => void;
}

const DueDateDisplay: React.FC<DueDateDisplayProps> = ({ dueDate, originalDueDate, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            dateInputRef.current?.focus();
        }
    }, [isEditing]);

    const handleDisplayClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(e.target.value);
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const alertIcon = useMemo(() => {
        if (!dueDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateObj = new Date(dueDate + 'T00:00:00');
        if (isNaN(dueDateObj.getTime())) return null;
        dueDateObj.setHours(0, 0, 0, 0);
        const timeDiff = dueDateObj.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (dayDiff < 0) return <WarningIconRed />;
        if (dayDiff <= 7) return <WarningIconYellow />;
        return null;
    }, [dueDate]);
    
    const formattedDate = useMemo(() => {
        if (!dueDate) return 'MM-DD-YY';
        try {
            const date = new Date(dueDate + 'T00:00:00');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${month}-${day}-${year}`;
        } catch (e) {
            return 'Invalid Date';
        }
    }, [dueDate]);
    
    const isUpdated = originalDueDate && dueDate !== originalDueDate;

    if (isEditing) {
        return (
            <div className="relative flex items-center gap-2" style={{ height: '28px' }}>
                 <span className="text-sm text-gray-600">Due:</span>
                 <input
                    ref={dateInputRef}
                    type="date"
                    value={dueDate}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    className="p-1 border border-indigo-400 rounded-md shadow-sm focus:outline-none h-full"
                />
            </div>
        );
    }

    return (
        <div 
          className="relative flex items-center gap-2 cursor-pointer group" 
          onClick={handleDisplayClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsEditing(true); } }}
          role="button" 
          tabIndex={0} 
          aria-label={`Due date: ${formattedDate}. Click to change.`}
          style={{ height: '28px' }}
        >
            <span className="text-sm text-gray-600">Due:</span>
            <span className={`font-bold text-lg w-[85px] group-hover:text-red-700 transition-colors ${!dueDate ? 'text-gray-400' : 'text-red-600'}`}>{formattedDate}</span>
            <CalendarIcon />
            <div className="w-5 h-5 flex items-center justify-center">{alertIcon}</div>
            {isUpdated && (
                <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
                    UPDATED
                </span>
            )}
        </div>
    );
};

// Autocomplete Select Input
interface SelectInputProps {
    value: string;
    onChange: (newValue: string) => void;
    options: string[];
    placeholder?: string;
    className?: string;
}

const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, options, placeholder, className }) => {
    const [inputValue, setInputValue] = useState(value);
    const [showOptions, setShowOptions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (document.activeElement !== wrapperRef.current?.querySelector('input')) {
            setInputValue(value);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowOptions(false);
                if (inputValue !== value) {
                    onChange(inputValue);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef, inputValue, value, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setShowOptions(true);
    };

    const handleSelectOption = (option: string) => {
        onChange(option);
        setInputValue(option);
        setShowOptions(false);
    };
    
    const handleInputBlur = () => {
        setTimeout(() => {
            if (wrapperRef.current && !wrapperRef.current.contains(document.activeElement)) {
                setShowOptions(false);
                if (inputValue !== value) {
                    onChange(inputValue);
                }
            }
        }, 150);
    };

    const filteredOptions = useMemo(() =>
        options.filter(option =>
            option.toLowerCase().includes((inputValue || '').toLowerCase())
        ), [options, inputValue]
    );

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setShowOptions(true)}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />
            {showOptions && filteredOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {filteredOptions.map(option => (
                        <li
                            key={option}
                            className="px-3 py-2 cursor-pointer hover:bg-indigo-100"
                            onMouseDown={() => handleSelectOption(option)}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// Project Card for Manager and Client Views
interface ProjectCardProps {
    project: Project;
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
    onDelete?: (project: Project) => void;
}


const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, onDelete }) => {
    const whatsLeft = calculateWhatsLeft(project.estRt, project.totalEdited);
    
    const handleUpdate = (field: keyof Project, value: string | number | boolean) => {
        onUpdate(project.id, field, value);
    };

    const handleNumberUpdate = (field: keyof Project, value: string) => {
        onUpdate(project.id, field, parseFloat(value) || 0);
    };

    const renderStatusButtons = () => {
        switch (project.status) {
            case 'ongoing':
                return (
                    <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-green-500 text-white hover:bg-green-600">
                        Mark as Done
                    </button>
                );
            case 'done':
                return (
                    <button onClick={() => handleUpdate('status', 'archived')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-gray-500 text-white hover:bg-gray-600">
                        Archive
                    </button>
                );
            case 'archived':
                 return (
                    <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600">
                        Unarchive
                    </button>
                );
            default:
                return null;
        }
    }

    return (
        <div
            className={`p-4 rounded-lg shadow-md flex flex-col lg:flex-row items-start gap-6 hover:shadow-lg transition-all duration-300 ${project.isOnHold ? 'bg-pink-100 border border-pink-300' : 'bg-white'}`}
            data-id={project.id}
        >
            {/* Left Column */}
            <div className="w-full lg:w-5/12 space-y-3 flex-shrink-0">
                <input
                    type="text"
                    value={project.title}
                    onChange={(e) => handleUpdate('title', e.target.value)}
                    className={`font-bold text-lg text-gray-800 w-full p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors duration-200`}
                    placeholder="Project Title"
                 />
                <DueDateDisplay
                    dueDate={project.dueDate}
                    originalDueDate={project.originalDueDate}
                    onUpdate={(newDate) => handleUpdate('dueDate', newDate)}
                />
                <textarea
                    value={project.notes}
                    onChange={(e) => handleUpdate('notes', e.target.value)}
                    placeholder="Notes..."
                    className="w-full h-24 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* Right Column */}
            <div className="w-full lg:w-7/12 flex-grow">
                <div className="flex justify-end items-center gap-2 mb-4">
                    <button
                        onClick={() => handleUpdate('isOnHold', !project.isOnHold)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap ${
                            project.isOnHold
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {project.isOnHold ? 'On Hold' : 'Set Hold'}
                    </button>
                    {renderStatusButtons()}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(project)}
                            className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                            aria-label="Delete project"
                            title="Delete project"
                        >
                            <TrashIcon />
                        </button>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">
                    {/* Personnel */}
                    <div className="space-y-3 text-sm flex-grow">
                        {/* Editor Row */}
                        <div className="flex items-center gap-2">
                            <strong className="text-gray-600 w-16 shrink-0 text-right">Editor:</strong>
                            <div className="flex-grow flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                    <SelectInput value={project.editor} onChange={(val) => handleUpdate('editor', val)} options={editors} placeholder="Name..." className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <input type="text" value={project.editorNote} onChange={(e) => handleUpdate('editorNote', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/>
                                </div>
                            </div>
                        </div>
                        {/* Master Row */}
                        <div className="flex items-center gap-2">
                            <strong className="text-gray-600 w-16 shrink-0 text-right">Master:</strong>
                            <div className="flex-grow flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                    <SelectInput value={project.master} onChange={(val) => handleUpdate('master', val)} options={masters} placeholder="Name..." className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <input type="text" value={project.masterNote} onChange={(e) => handleUpdate('masterNote', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/>
                                </div>
                            </div>
                        </div>
                        {/* PZ QC Row */}
                        <div className="flex items-center gap-2">
                            <strong className="text-gray-600 w-16 shrink-0 text-right">PZ QC:</strong>
                            <div className="flex-grow flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                    <SelectInput value={project.pzQc} onChange={(val) => handleUpdate('pzQc', val)} options={qcPersonnel} placeholder="Name..." className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <input type="text" value={project.pzQcNote} onChange={(e) => handleUpdate('pzQcNote', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-row flex-wrap justify-start gap-2 pt-4 lg:pt-0 flex-shrink-0">
                        <div className="bg-blue-50 p-2 rounded-lg w-24 text-center">
                            <input type="number" step="0.01" value={project.estRt} onChange={(e) => handleNumberUpdate('estRt', e.target.value)} className={`font-bold text-lg text-blue-800 text-center ${INLINE_INPUT_CLASS}`}/>
                            <p className="text-xs text-blue-600 mt-1">EST RT</p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded-lg w-24 text-center">
                            <input type="number" step="0.01" value={project.totalEdited} onChange={(e) => handleNumberUpdate('totalEdited', e.target.value)} className={`font-bold text-lg text-yellow-800 text-center ${INLINE_INPUT_CLASS}`}/>
                            <p className="text-xs text-yellow-600 mt-1">Edited</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg w-24 text-center">
                            <p className="font-bold text-lg text-green-800 h-9 flex items-center justify-center">{whatsLeft} hrs</p>
                            <p className="text-xs text-green-600 mt-1">What's Left</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg w-24 text-center">
                            <input type="number" step="0.01" value={project.remainingRaw} onChange={(e) => handleNumberUpdate('remainingRaw', e.target.value)} className={`font-bold text-lg text-purple-800 text-center ${INLINE_INPUT_CLASS}`}/>
                            <p className="text-xs text-purple-600 mt-1">Remaining RAW</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Manager View Component
interface ManagerViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void;
    onDelete: (project: Project) => void;
}

const ManagerView: React.FC<ManagerViewProps> = ({ projects, onUpdate, onDelete }) => {
    return (
        <div>
            <div className="space-y-4">
                {projects.length > 0 ? projects.map(project => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                    />
                )) : (
                    <div className="text-center py-12 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-gray-700">No projects to display.</h3>
                        <p className="text-gray-500 mt-2">Try adding a new project or changing the page view.</p>
                    </div>
                )}
            </div>
        </div>
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
        if (clients.length === 0) return [];
        return clients.sort((a, b) => {
            if (a === 'PRH') return -1;
            if (b === 'PRH') return 1;
            return a.localeCompare(b);
        });
    }, [groupedProjects]);

    return (
        <div className="space-y-8">
            {clientOrder.length > 0 ? clientOrder.map(clientName => (
                <div key={clientName}>
                    <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-200 text-gray-800">{clientName}</h2>
                    <div className="space-y-4">
                        {groupedProjects[clientName].map(project => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                onUpdate={onUpdate}
                            />
                        ))}
                    </div>
                </div>
            )) : (
                 <div className="text-center py-12 bg-white rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-gray-700">No projects to display.</h3>
                    <p className="text-gray-500 mt-2">Try adding a new project or changing the page view.</p>
                </div>
            )}
        </div>
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
        <div className={`grid grid-cols-2 md:grid-cols-7 gap-4 items-center p-3 border-b border-gray-200 ${project.isOnHold ? 'bg-pink-50' : ''}`}>
            <div className="col-span-2 md:col-span-3">
                <input type="text" value={project.title} onChange={(e) => onUpdate(project.id, 'title', e.target.value)} className={`font-semibold text-gray-800 ${INLINE_INPUT_CLASS}`} placeholder="Project Title" />
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-x-2">
                    <DueDateDisplay
                        dueDate={project.dueDate}
                        originalDueDate={project.originalDueDate}
                        onUpdate={(newDate) => onUpdate(project.id, 'dueDate', newDate)}
                    />
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center">
                        Editor:
                        <div className="w-24 ml-1">
                          <SelectInput value={project.editor} onChange={(val) => onUpdate(project.id, 'editor', val)} options={editors} placeholder="Name" className={`${INLINE_INPUT_CLASS}`} />
                        </div>
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
        <div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Editor Entries</h2>
                <div className="space-y-2">
                     {projects.length > 0 ? projects.map(project => (
                        <EditorRow key={project.id} project={project} onUpdate={onUpdate} />
                    )) : (
                         <div className="text-center py-10">
                            <h3 className="text-lg font-semibold text-gray-600">No ongoing projects.</h3>
                            <p className="text-gray-500 mt-1">All active edits are complete.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [currentPage, setCurrentPage] = useState<'ongoing' | 'done' | 'archived'>('ongoing');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);


    const sortedProjects = useMemo(() => {
        return projects;
    }, [projects]);
    
    const ongoingProjects = useMemo(() => sortedProjects.filter(p => p.status === 'ongoing'), [sortedProjects]);
    const doneProjects = useMemo(() => sortedProjects.filter(p => p.status === 'done'), [sortedProjects]);
    const archivedProjects = useMemo(() => sortedProjects.filter(p => p.status === 'archived'), [sortedProjects]);

    const handleSwitchView = (mode: ViewMode) => setViewMode(mode);

    const handleAddNewProject = useCallback(() => {
      const newProject: Project = {
        id: Date.now(),
        title: 'New Project - Click to Edit Title',
        dueDate: '',
        originalDueDate: '',
        notes: '',
        editor: '',
        editorNote: '',
        pzQc: '',
        pzQcNote: '',
        master: '',
        masterNote: '',
        estRt: 0,
        totalEdited: 0,
        remainingRaw: 0,
        isOnHold: false,
        status: 'ongoing',
      };
      setProjects(prev => [...prev, newProject]);
      setCurrentPage('ongoing');
    }, []);

    const handleUpdateProjectField = useCallback((id: number, field: keyof Project, value: string | number | boolean) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, []);
    
    const handleSortByDate = useCallback(() => {
        setProjects(prevProjects => {
            const sortFn = (a: Project, b: Project) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            };
            
            const ongoing = prevProjects.filter(p => p.status === 'ongoing').sort(sortFn);
            const done = prevProjects.filter(p => p.status === 'done').sort(sortFn);
            const archived = prevProjects.filter(p => p.status === 'archived').sort(sortFn);
            
            return [...ongoing, ...done, ...archived];
        });
    }, []);

    const handleOpenDeleteModal = useCallback((project: Project) => {
        setProjectToDelete(project);
    }, []);

    const handleCloseDeleteModal = useCallback(() => {
        setProjectToDelete(null);
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (projectToDelete) {
            setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
            setProjectToDelete(null);
        }
    }, [projectToDelete]);

    const renderCurrentView = () => {
        if (viewMode === 'editor') {
            return <EditorView projects={ongoingProjects} onUpdate={handleUpdateProjectField} />;
        }
        
        let projectsForPage: Project[];
        switch(currentPage) {
            case 'ongoing':
                projectsForPage = ongoingProjects;
                break;
            case 'done':
                projectsForPage = doneProjects;
                break;
            case 'archived':
                projectsForPage = archivedProjects;
                break;
            default:
                projectsForPage = [];
        }
        
        switch (viewMode) {
            case 'manager':
                return <ManagerView projects={projectsForPage} onUpdate={handleUpdateProjectField} onDelete={handleOpenDeleteModal} />;
            case 'client':
                return <ClientView projects={projectsForPage} onUpdate={handleUpdateProjectField} />;
            default:
                return null;
        }
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
                                <button onClick={handleAddNewProject} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center">
                                    <PlusIcon />
                                    <span className="hidden sm:inline">Add Project</span>
                                </button>
                            )}
                        </div>
                    </header>
    
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                 {viewMode !== 'editor' && (
                                    <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                        <button onClick={() => setCurrentPage('ongoing')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'ongoing' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Ongoing Edits</button>
                                        <button onClick={() => setCurrentPage('done')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'done' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Edit Done</button>
                                        <button onClick={() => setCurrentPage('archived')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'archived' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Archived Projects</button>
                                    </div>
                                 )}
                                 {viewMode === 'manager' && (
                                    <button onClick={handleSortByDate} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm">
                                        Sort by Date
                                    </button>
                                 )}
                            </div>
        
                            <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                <span className="text-sm font-medium hidden sm:block px-2">View Mode:</span>
                                <button onClick={() => handleSwitchView('manager')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'manager' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Manager</button>
                                <button onClick={() => handleSwitchView('client')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'client' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Client</button>
                                <button onClick={() => handleSwitchView('editor')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'editor' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Editor</button>
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

export default App;
