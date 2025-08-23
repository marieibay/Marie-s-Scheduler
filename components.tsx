
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Project, ViewMode } from './types';
import { editors, masters, qcPersonnel } from './employees';
import { getClientName, calculateWhatsLeft } from './utils';

// --- STYLING CONSTANTS ---
const INLINE_INPUT_CLASS = "bg-transparent focus:bg-white w-full p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors duration-200";

// --- ICON COMPONENTS ---
export const PlusIcon: React.FC = () => (
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

const StrikethroughIcon: React.FC = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 10H16" />
    <path d="M8.5 4.5S6.5 6.5 6.5 8c0 1.5 2 1.5 3.5 2.5s2.5 1.5 2.5 3c0 1.5-2 1.5-3.5 0.5" />
  </svg>
);


// --- CHILD COMPONENTS ---

// Rich Text Input for Notes
interface RichTextInputProps {
    value: string;
    onChange: (newValue: string) => void;
    placeholder?: string;
}

const ToolbarButton: React.FC<{onClick: () => void; title: string; children: React.ReactNode; isActive?: boolean;}> = ({onClick, title, children, isActive}) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-md flex items-center justify-center ${isActive ? 'bg-indigo-100 text-indigo-700' : ''}`}
        title={title}
    >
        {children}
    </button>
);

const ColorButton: React.FC<{onClick: () => void; title: string; color: string;}> = ({onClick, title, color}) => (
    <button
        type="button"
        onClick={onClick}
        className="w-6 h-6 rounded-full border-2 border-white ring-1 ring-gray-300 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title={title}
        style={{ backgroundColor: color }}
    />
);


const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder }) => {
    const [isFocused, setIsFocused] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const valueRef = useRef(value);

    useEffect(() => {
        valueRef.current = value;
        if (editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const handleFocus = () => setIsFocused(true);

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const newHtml = e.currentTarget.innerHTML;
        if (newHtml !== valueRef.current) {
            onChange(newHtml);
            valueRef.current = newHtml;
        }
        setIsFocused(false);
    };
    
    const handleToolbarMouseDown = (e: React.MouseEvent) => e.preventDefault();

    const applyFormat = (command: string, value?: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, value);
        }
    };

    return (
        <div className="relative">
            {isFocused && (
                <div 
                    onMouseDown={handleToolbarMouseDown}
                    className="absolute -top-12 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-xl p-1 flex items-center gap-1"
                >
                    <ToolbarButton onClick={() => applyFormat('bold')} title="Bold"><span className="font-bold">B</span></ToolbarButton>
                    <ToolbarButton onClick={() => applyFormat('strikeThrough')} title="Strikethrough"><StrikethroughIcon /></ToolbarButton>
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                    <ToolbarButton onClick={() => applyFormat('fontSize', '1')} title="Small Text">S</ToolbarButton>
                    <ToolbarButton onClick={() => applyFormat('fontSize', '3')} title="Medium Text">M</ToolbarButton>
                    <ToolbarButton onClick={() => applyFormat('fontSize', '5')} title="Large Text">L</ToolbarButton>
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                    <div className="flex items-center gap-2 px-1">
                        <ColorButton onClick={() => applyFormat('foreColor', '#374151')} title="Default Gray" color="#374151" />
                        <ColorButton onClick={() => applyFormat('foreColor', '#EF4444')} title="Red" color="#EF4444" />
                        <ColorButton onClick={() => applyFormat('foreColor', '#F59E0B')} title="Yellow" color="#F59E0B" />
                    </div>
                </div>
            )}
            <div
                ref={editorRef}
                contentEditable
                onFocus={handleFocus}
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{ __html: value }}
                data-placeholder={placeholder}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none overflow-y-auto empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 whitespace-pre-wrap resize-y"
                style={{minHeight: '6rem'}}
            />
        </div>
    );
};


// Delete Confirmation Modal
interface DeleteConfirmationModalProps {
    projectTitle: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ projectTitle, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Project</h3>
                <div className="mt-2 px-7 py-3"><p className="text-sm text-gray-500">Are you sure you want to delete "{projectTitle}"? This cannot be undone.</p></div>
                <div className="items-center px-4 py-3 space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700">Delete</button>
                </div>
            </div>
        </div>
    </div>
);

// Due Date Display with Alerts
interface DueDateDisplayProps {
    due_date: string | null;
    original_due_date: string | null;
    onUpdate: (newDate: string) => void;
    isReadOnly?: boolean;
}

export const DueDateDisplay: React.FC<DueDateDisplayProps> = ({ due_date, original_due_date, onUpdate, isReadOnly = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (isEditing) dateInputRef.current?.focus(); }, [isEditing]);

    const handleDisplayClick = (e: React.MouseEvent) => {
        if (isReadOnly) return;
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleInputBlur = () => setIsEditing(false);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(e.target.value);
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === 'Escape') setIsEditing(false);
    };

    const alertIcon = useMemo(() => {
        if (!due_date) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateObj = new Date(due_date + 'T00:00:00');
        if (isNaN(dueDateObj.getTime())) return null;
        const timeDiff = dueDateObj.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (dayDiff < 0) return <WarningIconRed />;
        if (dayDiff <= 7) return <WarningIconYellow />;
        return null;
    }, [due_date]);
    
    const formattedDate = useMemo(() => {
        if (!due_date) return 'MM/DD/YY';
        const date = new Date(due_date + 'T00:00:00');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${month}/${day}/${year}`;
    }, [due_date]);
    
    const isUpdated = original_due_date && due_date !== original_due_date;
    const interactionClasses = isReadOnly ? '' : 'cursor-pointer group';
    const hoverTextClass = isReadOnly ? '' : 'group-hover:text-red-700';

    if (isEditing && !isReadOnly) {
        return (
            <div className="relative flex items-center gap-2" style={{ height: '28px' }}>
                 <span className="text-sm text-gray-600">Due:</span>
                 <input ref={dateInputRef} type="date" value={due_date || ''} onChange={handleInputChange} onBlur={handleInputBlur} onKeyDown={handleInputKeyDown} className="p-1 border border-indigo-400 rounded-md shadow-sm"/>
            </div>
        );
    }

    return (
        <div 
          className={`relative flex items-center gap-2 ${interactionClasses}`} 
          onClick={handleDisplayClick}
          onKeyDown={(e) => { if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setIsEditing(true); } }}
          role={isReadOnly ? undefined : "button"} 
          tabIndex={isReadOnly ? -1 : 0} 
          aria-label={`Due date: ${formattedDate}.`}
          style={{ height: '28px' }}
        >
            <span className="text-sm text-gray-600">Due:</span>
            <span className={`font-bold text-lg w-[85px] transition-colors ${!due_date ? 'text-gray-400' : 'text-red-600'} ${hoverTextClass}`}>{formattedDate}</span>
            <div className="w-5 h-5 flex items-center justify-center">{alertIcon}</div>
            {isUpdated && <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">UPDATED</span>}
        </div>
    );
};

// Autocomplete Select Input
interface SelectInputProps { value: string; onChange: (newValue: string) => void; options: string[]; placeholder?: string; className?: string; }
export const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, options, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const filteredOptions = useMemo(() => options.filter(option => option.toLowerCase().includes((value || '').toLowerCase())), [options, value]);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { onChange(e.target.value); if (!isOpen) setIsOpen(true); };
    const handleOptionClick = (option: string) => { onChange(option); setIsOpen(false); };
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOpen(false); };
    return (
        <div className="relative w-full" onBlur={handleBlur}>
            <input type="text" value={value} onChange={handleInputChange} onFocus={() => setIsOpen(true)} placeholder={placeholder} className={className} autoComplete="off"/>
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {filteredOptions.map((option) => (
                        <li key={option} className="px-3 py-2 cursor-pointer hover:bg-indigo-50" onClick={() => handleOptionClick(option)}>{option}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};


// Project Card for Manager and Client Views
interface ProjectCardProps { project: Project; onUpdate: (id: number, field: keyof Project, value: string | number | boolean | null) => void; onDelete?: (project: Project) => void; }
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, onDelete }) => {
    const handleUpdate = (field: keyof Project, value: any) => onUpdate(project.id, field, value);
    const renderStatusButtons = () => {
        switch (project.status) {
            case 'ongoing': return <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-green-500 text-white hover:bg-green-600">Mark as Done</button>;
            case 'done': return <button onClick={() => handleUpdate('status', 'archived')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-gray-500 text-white hover:bg-gray-600">Archive</button>;
            case 'archived': return <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600">Unarchive</button>;
            default: return null;
        }
    }

    return (
        <div className={`p-4 rounded-lg shadow-md flex flex-col lg:flex-row items-start gap-6 hover:shadow-lg transition-all duration-300 ${project.is_on_hold ? 'bg-pink-100 border border-pink-300' : 'bg-white'}`} data-id={project.id}>
            <div className="w-full lg:w-5/12 space-y-3 flex-shrink-0">
                <input type="text" value={project.title} onChange={(e) => handleUpdate('title', e.target.value)} className="font-bold text-lg text-gray-800 w-full p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Project Title"/>
                <DueDateDisplay due_date={project.due_date} original_due_date={project.original_due_date} onUpdate={(newDate) => handleUpdate('due_date', newDate)} />
                <RichTextInput value={project.notes} onChange={(newValue) => handleUpdate('notes', newValue)} placeholder="Notes..." />
            </div>
            <div className="w-full lg:w-7/12 flex-grow">
                <div className="flex justify-end items-center gap-2 mb-4">
                    <button onClick={() => handleUpdate('is_on_hold', !project.is_on_hold)} className={`px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap ${project.is_on_hold ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{project.is_on_hold ? 'On Hold' : 'Set Hold'}</button>
                    {renderStatusButtons()}
                    {onDelete && <button onClick={() => onDelete(project)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600" title="Delete"><TrashIcon /></button>}
                </div>
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                    <div className="space-y-3 text-sm flex-grow">
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">Editor:</strong><div className="flex-grow flex items-center gap-2"><div className="flex-1 min-w-0"><SelectInput value={project.editor} onChange={(val) => handleUpdate('editor', val)} options={editors} placeholder="Name..." className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} /></div><div className="flex-1 min-w-0"><input type="text" value={project.editor_note} onChange={(e) => handleUpdate('editor_note', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/></div></div></div>
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">Master:</strong><div className="flex-grow flex items-center gap-2"><div className="flex-1 min-w-0"><SelectInput value={project.master} onChange={(val) => handleUpdate('master', val)} options={masters} placeholder="Name..." className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} /></div><div className="flex-1 min-w-0"><input type="text" value={project.master_note} onChange={(e) => handleUpdate('master_note', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/></div></div></div>
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">PZ QC:</strong><div className="flex-grow flex items-center gap-2"><div className="flex-1 min-w-0"><SelectInput value={project.pz_qc} onChange={(val) => handleUpdate('pz_qc', val)} options={qcPersonnel} placeholder="Name..." className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} /></div><div className="flex-1 min-w-0"><input type="text" value={project.pz_qc_note} onChange={(e) => handleUpdate('pz_qc_note', e.target.value)} className={INLINE_INPUT_CLASS} placeholder="Note..."/></div></div></div>
                    </div>
                    <div className="flex flex-row flex-wrap justify-start gap-2 pt-4 md:pt-0 flex-shrink-0">
                        <div className="bg-blue-50 p-2 rounded-lg w-24 text-center"><input type="number" step="0.01" value={project.est_rt} onChange={(e) => handleUpdate('est_rt', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-blue-800 text-center ${INLINE_INPUT_CLASS}`}/><p className="text-xs text-blue-600 mt-1">EST RT</p></div>
                        <div className="bg-yellow-50 p-2 rounded-lg w-24 text-center"><input type="number" step="0.01" value={project.total_edited} onChange={(e) => handleUpdate('total_edited', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-yellow-800 text-center ${INLINE_INPUT_CLASS}`}/><p className="text-xs text-yellow-600 mt-1">Edited</p></div>
                        <div className="bg-green-50 p-2 rounded-lg w-24 text-center"><p className="font-bold text-lg text-green-800 h-9 flex items-center justify-center">{calculateWhatsLeft(project.est_rt, project.total_edited)} hrs</p><p className="text-xs text-green-600 mt-1">What's Left</p></div>
                        <div className="bg-purple-50 p-2 rounded-lg w-24 text-center"><input type="number" step="0.01" value={project.remaining_raw} onChange={(e) => handleUpdate('remaining_raw', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-purple-800 text-center ${INLINE_INPUT_CLASS}`}/><p className="text-xs text-purple-600 mt-1">Remaining RAW</p></div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Manager View Component
interface ManagerViewProps { projects: Project[]; onUpdate: (id: number, field: keyof Project, value: string | number | boolean | null) => void; onDelete: (project: Project) => void; }
export const ManagerView: React.FC<ManagerViewProps> = ({ projects, onUpdate, onDelete }) => (
    <div className="space-y-4">
        {projects.length > 0 ? projects.map(project => <ProjectCard key={project.id} project={project} onUpdate={onUpdate} onDelete={onDelete} />) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-700">No projects to display.</h3>
                <p className="text-gray-500 mt-2">Try adding a new project or changing the page view.</p>
            </div>
        )}
    </div>
);

// Client View Component
interface ClientViewProps { projects: Project[]; onUpdate: (id: number, field: keyof Project, value: string | number | boolean | null) => void; }
export const ClientView: React.FC<ClientViewProps> = ({ projects, onUpdate }) => {
    const groupedProjects = useMemo(() => {
        const groups = projects.reduce((acc, project) => {
            const client = getClientName(project);
            if (!acc[client]) acc[client] = [];
            acc[client].push(project);
            return acc;
        }, {} as Record<string, Project[]>);
        for (const clientName in groups) {
            groups[clientName].sort((a, b) => {
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
        }
        return groups;
    }, [projects]);
    const clientOrder = useMemo(() => Object.keys(groupedProjects).sort((a, b) => a === 'PRH' ? -1 : b === 'PRH' ? 1 : a.localeCompare(b)), [groupedProjects]);
    return (
        <div className="space-y-8">
            {clientOrder.length > 0 ? clientOrder.map(clientName => (
                <div key={clientName}>
                    <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-200 text-gray-800">{clientName}</h2>
                    <div className="space-y-4">
                        {groupedProjects[clientName].map(project => <ProjectCard key={project.id} project={project} onUpdate={onUpdate} />)}
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
interface EditorRowProps { project: Project; onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void; }
export const EditorRow: React.FC<EditorRowProps> = ({ project, onUpdate }) => {
    const handleInputChange = (field: keyof Project, value: string) => onUpdate(project.id, field, parseFloat(value) || 0);
    return (
        <div className={`grid grid-cols-2 md:grid-cols-7 gap-4 items-center p-3 border-b border-gray-200 ${project.is_on_hold ? 'bg-pink-50' : ''}`}>
            <div className="col-span-2 md:col-span-3">
                <input type="text" value={project.title} readOnly className={`font-semibold text-gray-800 bg-gray-50 w-full p-1 -m-1 rounded`} />
                <div className="flex flex-wrap items-center text-sm text-gray-500 mt-1 gap-x-2">
                    <DueDateDisplay due_date={project.due_date} original_due_date={project.original_due_date} onUpdate={() => {}} isReadOnly={true} />
                    <span className="hidden sm:inline">|</span>
                    <span className="flex items-center">
                        Editor:
                        <div className="w-24 ml-1"><SelectInput value={project.editor} onChange={(val) => onUpdate(project.id, 'editor', val)} options={editors} placeholder="Name" className={INLINE_INPUT_CLASS} /></div>
                        <input type="text" value={project.editor_note} onChange={(e) => onUpdate(project.id, 'editor_note', e.target.value)} className={`${INLINE_INPUT_CLASS} flex-grow ml-1`} placeholder="Note..."/>
                    </span>
                </div>
            </div>
            <div className="text-center"><label className="text-xs text-gray-500 block mb-1">EST RT</label><input type="number" step="0.01" value={project.est_rt} readOnly className="w-full border-gray-300 rounded-md shadow-sm text-center p-1 bg-gray-50"/></div>
            <div><label className="text-xs text-gray-500 block mb-1">Total Edited</label><input type="number" step="0.01" value={project.total_edited} onChange={(e) => handleInputChange('total_edited', e.target.value)} className="font-bold text-lg w-full border-gray-300 rounded-md shadow-sm text-center p-1"/></div>
            <div className="text-center bg-gray-50 p-2 rounded-lg"><p className="font-medium">{calculateWhatsLeft(project.est_rt, project.total_edited)}</p><p className="text-xs text-gray-500">What's Left</p></div>
            <div><label className="text-xs text-gray-500 block mb-1">Remaining RAW</label><input type="number" step="0.01" value={project.remaining_raw} onChange={(e) => handleInputChange('remaining_raw', e.target.value)} className="font-bold text-lg w-full border-gray-300 rounded-md shadow-sm text-center p-1"/></div>
        </div>
    );
};


// Editor View Component
interface EditorViewProps { projects: Project[]; onUpdate: (id: number, field: keyof Project, value: string | number | boolean) => void; }
export const EditorView: React.FC<EditorViewProps> = ({ projects, onUpdate }) => {
    return (
        <div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Editor Entries</h2>
                <div className="space-y-2">
                     {projects.length > 0 ? projects.map(project => <EditorRow key={project.id} project={project} onUpdate={onUpdate} />) : (
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
