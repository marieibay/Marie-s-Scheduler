
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Project, ProductivityLog } from './types';
import { editors, masters, qcPersonnel } from './employees';
import { getClientName, calculateWhatsLeft } from './utils';
import { supabase } from './supabaseClient';

// --- STYLING CONSTANTS ---
const INLINE_INPUT_CLASS = "bg-transparent focus:bg-white w-full p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors duration-200";

// --- ICON COMPONENTS ---
export const PlusIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

export const MemoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);


// --- CHILD COMPONENTS ---

// Daily Notes Widget
interface DailyNotesWidgetProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onClose: () => void;
}
export const DailyNotesWidget: React.FC<DailyNotesWidgetProps> = ({ content, onContentChange, onClose }) => {
    return (
        <div className="fixed bottom-8 right-8 z-30 w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col transform transition-all duration-300 ease-in-out animate-fade-in-up">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                   Daily Notes & Assignments
                </h2>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Close Notes">
                    <XIcon />
                </button>
            </div>
            <div className="p-4 bg-gray-50/50">
                <textarea
                    value={content}
                    onChange={(e) => onContentChange(e.target.value)}
                    placeholder="List free editors for the day or other important notes..."
                    className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-inner text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    aria-label="Daily Notes Input"
                />
            </div>
            <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


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
        if (valueRef.current !== value && editorRef.current && document.activeElement !== editorRef.current) {
            editorRef.current.innerHTML = value;
        }
        valueRef.current = value;
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
    onUpdate: (newDate: string | null) => void;
    isReadOnly?: boolean;
}

export const DueDateDisplay: React.FC<DueDateDisplayProps> = ({ due_date, original_due_date, onUpdate, isReadOnly = false }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const textInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    const formatDateForDisplay = (dateStr: string | null): string => {
        if (!dateStr) return 'MM/DD/YYYY';
        const date = new Date(dateStr + 'T00:00:00');
        if (isNaN(date.getTime())) return 'MM/DD/YYYY';
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${month}/${day}/${year}`;
    };

    const formatDateForNativePicker = (dateStr: string | null): string => {
        return dateStr || '';
    };

    useEffect(() => {
        if (isEditing) {
            const formatted = formatDateForDisplay(due_date);
            setInputValue(formatted === 'MM/DD/YYYY' ? '' : formatted);
            textInputRef.current?.focus();
            textInputRef.current?.select();
        }
    }, [isEditing, due_date]);

    const handleDisplayClick = (e: React.MouseEvent) => {
        if (isReadOnly) return;
        e.stopPropagation();
        setIsEditing(true);
    };

    const saveDate = () => {
        setIsEditing(false);
        if (!inputValue.trim()) {
            if (due_date !== null) onUpdate(null);
            return;
        }

        const parts = inputValue.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (parts) {
            const month = parseInt(parts[1], 10);
            const day = parseInt(parts[2], 10);
            const year = parseInt(parts[3], 10);
            if (month < 1 || month > 12 || day < 1 || day > 31) return;
            
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime()) && date.getFullYear() === year && date.getMonth() + 1 === month && date.getDate() === day) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                const newDateString = `${yyyy}-${mm}-${dd}`;
                if (newDateString !== due_date) onUpdate(newDateString);
            }
        }
    };
    
    const handleInputBlur = () => saveDate();
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value);
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') { e.preventDefault(); saveDate(); }
        else if (e.key === 'Escape') setIsEditing(false);
    };
    
    const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        onUpdate(newDate || null);
        if (newDate) setInputValue(formatDateForDisplay(newDate));
        else setInputValue('');
    };
    
    const showPicker = () => {
        try { dateInputRef.current?.showPicker(); }
        catch (error) { console.error("showPicker() is not supported by this browser.", error); }
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
    
    const formattedDate = useMemo(() => formatDateForDisplay(due_date), [due_date]);
    const isUpdated = original_due_date && due_date !== original_due_date;
    const interactionClasses = isReadOnly ? '' : 'cursor-pointer group';
    const hoverTextClass = isReadOnly ? '' : 'group-hover:text-red-700';

    if (isEditing && !isReadOnly) {
        return (
            <div className="relative flex items-center gap-2" style={{ height: '28px' }}>
                 <span className="text-sm text-gray-600">Due:</span>
                 <div className="relative">
                     <input
                        ref={textInputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        placeholder="MM/DD/YYYY"
                        className="p-1 border border-indigo-400 rounded-md shadow-sm w-[120px] pr-8"
                        aria-label="Due date text input"
                     />
                     <button 
                        type="button" 
                        onClick={showPicker}
                        className="absolute right-0 top-0 h-full px-2 text-gray-500 hover:text-indigo-600"
                        aria-label="Open date picker"
                        title="Open date picker"
                    >
                         <CalendarIcon className="h-5 w-5" />
                     </button>
                 </div>
                 <input
                    ref={dateInputRef}
                    type="date"
                    value={formatDateForNativePicker(due_date)}
                    onChange={handleNativeDateChange}
                    className="absolute w-0 h-0 -z-10 opacity-0 pointer-events-none"
                    tabIndex={-1}
                    aria-hidden="true"
                 />
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
            <span className={`font-bold text-lg w-[100px] transition-colors ${!due_date ? 'text-gray-400' : 'text-red-600'} ${hoverTextClass}`}>{formattedDate}</span>
            <div className="w-5 h-5 flex items-center justify-center">{alertIcon}</div>
            {isUpdated && <span className="px-2 py-0.5 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">UPDATED</span>}
        </div>
    );
};


// Autocomplete Select Input
interface SelectInputProps { value: string; onChange: (newValue: string) => void; options: string[]; placeholder?: string; className?: string; }
export const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, options, placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const filteredOptions = useMemo(() => options.filter(option => option.toLowerCase().includes((inputValue || '').toLowerCase())), [options, inputValue]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { 
        setInputValue(e.target.value); 
        if (!isOpen) setIsOpen(true); 
    };
    
    const handleOptionClick = (option: string) => { 
        setInputValue(option); 
        onChange(option); 
        setIsOpen(false); 
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => { 
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
             setIsOpen(false);
             if (inputValue !== value) {
                onChange(inputValue);
             }
        }
    };
    
    return (
        <div className="relative w-full" onBlur={handleBlur}>
            <input type="text" value={inputValue} onChange={handleInputChange} onFocus={() => setIsOpen(true)} placeholder={placeholder} className={className} autoComplete="off"/>
            {isOpen && filteredOptions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                    {filteredOptions.map((option) => (
                        <li key={option} className="px-3 py-2 cursor-pointer hover:bg-indigo-50" onMouseDown={() => handleOptionClick(option)}>{option}</li>
                    ))}
                </ul>
            )}
        </div>
    );
};


// Project Card for Manager and Client Views
interface ProjectCardProps {
    project: Project;
    onUpdate: (id: number, field: keyof Project, value: string | number | boolean | null) => void;
    onDelete?: (project: Project) => void;
    isClientView?: boolean;
    isNewEditColumnMissing?: boolean;
}
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, onDelete, isClientView = false, isNewEditColumnMissing = false }) => {
    const handleUpdate = (field: keyof Project, value: any) => onUpdate(project.id, field, value);
    const renderStatusButtons = () => {
        switch (project.status) {
            case 'ongoing': return <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-green-500 text-white hover:bg-green-600">Mark as Done</button>;
            case 'done': return <button onClick={() => handleUpdate('status', 'archived')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-gray-500 text-white hover:bg-gray-600">Archive</button>;
            case 'archived': return <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-purple-500 text-white hover:bg-purple-600">Unarchive</button>;
            default: return null;
        }
    }

    const renderField = (value: string, field: keyof Project, options?: string[], placeholder?: string, isNote?: boolean) => {
        if (isClientView) return <span className={`p-1 ${!value && 'text-gray-400'}`}>{value || (isNote ? '' : placeholder)}</span>
        if (options) return <SelectInput value={value} onChange={(val) => handleUpdate(field, val)} options={options} placeholder={placeholder} className={`${INLINE_INPUT_CLASS} font-semibold text-lg`} />
        return <input type="text" value={value} onChange={(e) => handleUpdate(field, e.target.value)} className={INLINE_INPUT_CLASS} placeholder={placeholder}/>
    }

    const renderNumberField = (value: number, field: keyof Project) => {
      if (isClientView) return <p className="font-bold text-lg text-blue-800 text-center h-9 flex items-center justify-center">{value || 0}</p>
      return <input type="number" step="0.01" value={value || 0} onChange={(e) => handleUpdate(field, parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-blue-800 text-center h-9 ${INLINE_INPUT_CLASS}`}/>
    }
    
    const cardBgClass = useMemo(() => {
        if (project.status === 'done') return 'bg-lime-200 border border-lime-300';
        if (project.is_new_edit) return 'bg-amber-100 border border-amber-200';
        if (project.is_on_hold) return 'bg-pink-100 border border-pink-300';
        return 'bg-white';
    }, [project.status, project.is_on_hold, project.is_new_edit]);

    return (
        <div className={`p-4 rounded-lg shadow-md flex flex-col lg:flex-row items-start gap-6 hover:shadow-lg transition-all duration-300 ${cardBgClass}`} data-id={project.id}>
            <div className="w-full lg:w-5/12 space-y-3 flex-shrink-0">
                {isClientView ? 
                    <h2 className="font-bold text-lg text-gray-800 p-1">{project.title}</h2> : 
                    <input type="text" value={project.title} onChange={(e) => handleUpdate('title', e.target.value)} className="font-bold text-lg text-gray-800 w-full p-1 -m-1 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="Project Title"/>
                }
                <DueDateDisplay due_date={project.due_date} original_due_date={project.original_due_date} onUpdate={(newDate) => handleUpdate('due_date', newDate)} isReadOnly={isClientView}/>
                {isClientView ? 
                   <div className="w-full p-2 border border-transparent rounded-md whitespace-pre-wrap" style={{minHeight: '6rem'}} dangerouslySetInnerHTML={{ __html: project.notes || ''}} /> : 
                   <RichTextInput value={project.notes} onChange={(newValue) => handleUpdate('notes', newValue)} placeholder="Notes..." />
                }
            </div>
            <div className="w-full lg:w-7/12 flex-grow">
                {!isClientView && (
                    <div className="flex justify-end items-center gap-2 mb-4">
                        <button 
                            onClick={() => handleUpdate('is_new_edit', !project.is_new_edit)} 
                            disabled={isNewEditColumnMissing}
                            title={isNewEditColumnMissing ? "Feature unavailable: Please add 'is_new_edit' column to the database." : "Toggle New Edit status"}
                            className={`px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap ${project.is_new_edit ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed`}>
                            New Edit
                        </button>
                        <button onClick={() => handleUpdate('is_on_hold', !project.is_on_hold)} className={`px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap ${project.is_on_hold ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{project.is_on_hold ? 'On Hold' : 'Set Hold'}</button>
                        {renderStatusButtons()}
                        {onDelete && <button onClick={() => onDelete(project)} className="p-1.5 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600" title="Delete"><TrashIcon /></button>}
                    </div>
                )}
                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
                    <div className="space-y-3 text-sm flex-grow">
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">Editor:</strong><div className="flex-grow flex items-center gap-2"><div className="flex-1 min-w-0">{renderField(project.editor, 'editor', editors, 'Name...')}</div><div className="flex-1 min-w-0">{renderField(project.editor_note, 'editor_note', undefined, 'Note...', true)}</div></div></div>
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">Master:</strong><div className="flex-grow flex items-center gap-2"><div className="flex-1 min-w-0">{renderField(project.master, 'master', masters, 'Name...')}</div><div className="flex-1 min-w-0">{renderField(project.master_note, 'master_note', undefined, 'Note...', true)}</div></div></div>
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">PZ QC:</strong><div className="flex-grow flex items-center gap-2"><div className="flex-1 min-w-0">{renderField(project.pz_qc, 'pz_qc', qcPersonnel, 'Name...')}</div><div className="flex-1 min-w-0">{renderField(project.pz_qc_note, 'pz_qc_note', undefined, 'Note...', true)}</div></div></div>
                    </div>
                    <div className="flex flex-row flex-wrap justify-start gap-2 pt-4 md:pt-0 flex-shrink-0">
                        <div className="bg-blue-50 p-2 rounded-lg w-24 text-center">
                            {renderNumberField(project.est_rt, 'est_rt')}
                            <p className="text-xs text-blue-600 mt-1">EST RT</p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded-lg w-24 text-center">
                            <p className="font-bold text-lg text-yellow-800 text-center h-9 flex items-center justify-center">{project.total_edited || 0}</p>
                            <p className="text-xs text-yellow-600 mt-1">Edited</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg w-24 text-center">
                            <p className="font-bold text-lg text-green-800 h-9 flex items-center justify-center">{calculateWhatsLeft(project.est_rt, project.total_edited)}</p>
                            <p className="text-xs text-green-600 mt-1">What's Left</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg w-24 text-center">
                            {isClientView ? <p className="font-bold text-lg text-purple-800 text-center h-9 flex items-center justify-center">{project.remaining_raw || 0}</p> : <input type="number" step="0.01" value={project.remaining_raw || 0} onChange={(e) => handleUpdate('remaining_raw', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-purple-800 text-center h-9 ${INLINE_INPUT_CLASS}`}/>}
                            <p className="text-xs text-purple-600 mt-1">Remaining RAW</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- VIEW COMPONENTS ---

interface ViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: any) => void;
    onDelete?: (project: Project) => void;
    isNewEditColumnMissing?: boolean;
}

export const ManagerView: React.FC<ViewProps> = ({ projects, onUpdate, onDelete, isNewEditColumnMissing }) => {
    if (projects.length === 0) return <div className="text-center text-gray-500 py-10">No projects to display in this category.</div>;
    return (
        <div className="space-y-4">
            {projects.map(project => (
                <ProjectCard key={project.id} project={project} onUpdate={onUpdate} onDelete={onDelete} isClientView={false} isNewEditColumnMissing={isNewEditColumnMissing} />
            ))}
        </div>
    );
};

export const ClientView: React.FC<Omit<ViewProps, 'onDelete'>> = ({ projects, onUpdate }) => {
    if (projects.length === 0) return <div className="text-center text-gray-500 py-10">No projects to display in this category.</div>;
    return (
        <div className="space-y-4">
            {projects.map(project => (
                 <ProjectCard key={project.id} project={project} onUpdate={onUpdate} isClientView={true} />
            ))}
        </div>
    );
};

export const EditorView: React.FC<Omit<ViewProps, 'onDelete'>> = ({ projects, onUpdate }) => {
    const handleUpdate = (id: number, field: keyof Project, value: any) => onUpdate(id, field, value);

    if (projects.length === 0) return <div className="text-center text-gray-500 py-10">No ongoing projects assigned.</div>;
    
    return (
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Client</th>
                        <th scope="col" className="px-6 py-3">Title</th>
                        <th scope="col" className="px-6 py-3">Due Date</th>
                        <th scope="col" className="px-6 py-3">Editor</th>
                        <th scope="col" className="px-6 py-3">EST RT</th>
                        <th scope="col" className="px-6 py-3">Total Edited</th>
                        <th scope="col" className="px-6 py-3">What's Left</th>
                        <th scope="col" className="px-6 py-3">Remaining Raw</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project) => (
                        <tr key={project.id} className={`border-b hover:bg-gray-50 ${project.is_on_hold ? 'bg-pink-100' : 'bg-white'}`}>
                            <td className="px-6 py-4 font-semibold text-gray-900">{getClientName(project)}</td>
                            <td className="px-6 py-4">{project.title}</td>
                            <td className="px-6 py-4">
                               <DueDateDisplay due_date={project.due_date} original_due_date={project.original_due_date} onUpdate={(newDate) => handleUpdate(project.id, 'due_date', newDate)} isReadOnly={true} />
                            </td>
                            <td className="px-6 py-4 font-semibold">{project.editor}</td>
                            <td className="px-6 py-4">{project.est_rt}</td>
                            <td className="px-6 py-4">{project.total_edited}</td>
                            <td className="px-6 py-4 font-semibold">{calculateWhatsLeft(project.est_rt, project.total_edited)}</td>
                            <td className="px-6 py-4 w-32">
                               <input type="number" step="0.01" value={project.remaining_raw ?? ''} onChange={(e) => handleUpdate(project.id, 'remaining_raw', parseFloat(e.target.value) || 0)} className="w-full p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


// --- PRODUCTIVITY COMPONENTS ---

// Date utilities
const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(d.setDate(diff));
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getWeekDays = (startOfWeek: Date): Date[] => {
  return Array.from({ length: 5 }).map((_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
};

export const ProductivityLogger: React.FC<{ projects: Project[], editorName: string }> = ({ projects, editorName }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekLog, setWeekLog] = useState<Record<number, Record<string, number>>>({});
    const [initialLog, setInitialLog] = useState<Record<number, Record<string, number>>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
    const weekDays = useMemo(() => getWeekDays(startOfWeek), [startOfWeek]);

    useEffect(() => {
        const fetchLogs = async () => {
            if (!editorName) return;
            setIsLoading(true);
            const fromDate = formatDate(startOfWeek);
            const toDate = formatDate(weekDays[weekDays.length - 1]);
            const { data, error } = await supabase
                .from('productivity_logs')
                .select('*')
                .eq('editor_name', editorName)
                .gte('date', fromDate)
                .lte('date', toDate);

            if (error) {
                setError(error.message);
            } else {
                const logs: Record<number, Record<string, number>> = {};
                (data || []).forEach(log => {
                    if (!logs[log.project_id]) logs[log.project_id] = {};
                    logs[log.project_id][log.date] = log.hours_worked;
                });
                setWeekLog(logs);
                setInitialLog(JSON.parse(JSON.stringify(logs))); // Deep copy for comparison
            }
            setIsLoading(false);
        };
        fetchLogs();
    }, [editorName, startOfWeek]);

    const handleHourChange = (projectId: number, date: string, hours: string) => {
        const numericHours = parseFloat(hours) || 0;
        setWeekLog(prev => ({
            ...prev,
            [projectId]: {
                ...prev[projectId],
                [date]: numericHours
            }
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        setError(null);
        const changedProjectIds = new Set<number>();
        const upserts: ProductivityLog[] = [];
        const deletes: { project_id: number, date: string }[] = [];

        Object.keys(weekLog).forEach(projIdStr => {
            const projectId = parseInt(projIdStr, 10);
            const projectDates = weekLog[projectId];
            Object.keys(projectDates).forEach(date => {
                const hours = projectDates[date];
                const initialHours = initialLog[projectId]?.[date] || 0;

                if (hours !== initialHours) {
                    changedProjectIds.add(projectId);
                    if (hours > 0) {
                        upserts.push({ project_id: projectId, editor_name: editorName, date, hours_worked: hours });
                    } else if (initialHours > 0) {
                        deletes.push({ project_id: projectId, date });
                    }
                }
            });
        });
        
        try {
            if (upserts.length > 0) {
                const { error: upsertError } = await supabase.from('productivity_logs').upsert(upserts, { onConflict: 'editor_name,project_id,date' });
                if (upsertError) throw upsertError;
            }
            if (deletes.length > 0) {
                for (const del of deletes) {
                    const { error: deleteError } = await supabase.from('productivity_logs').delete().match({ editor_name: editorName, project_id: del.project_id, date: del.date });
                    if (deleteError) throw deleteError;
                }
            }
            
            // Recalculate totals
            for (const projectId of changedProjectIds) {
                const { data: allLogs, error: sumError } = await supabase.from('productivity_logs').select('hours_worked').eq('project_id', projectId);
                if (sumError) throw sumError;

                const total_edited = allLogs.reduce((sum, log) => sum + log.hours_worked, 0);
                const { error: updateError } = await supabase.from('projects').update({ total_edited }).eq('id', projectId);
                if (updateError) throw updateError;
            }

            setInitialLog(JSON.parse(JSON.stringify(weekLog)));
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (projects.length === 0) {
        return <div className="text-center text-gray-500 py-10">You have no ongoing projects assigned.</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="px-3 py-1 bg-white border rounded-md">&larr; Prev Week</button>
                <h3 className="text-lg font-semibold">Week of {startOfWeek.toLocaleDateString()}</h3>
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="px-3 py-1 bg-white border rounded-md">Next Week &rarr;</button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 min-w-[250px]">Project</th>
                            {weekDays.map(day => <th key={day.toISOString()} className="px-4 py-3 w-28 text-center">{day.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}</th>)}
                            <th className="px-4 py-3 w-32 text-center">Weekly Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map(project => {
                            const weeklyTotal = weekDays.reduce((acc, day) => acc + (weekLog[project.id]?.[formatDate(day)] || 0), 0);
                            return (
                                <tr key={project.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-900">{project.title}</td>
                                    {weekDays.map(day => (
                                        <td key={day.toISOString()} className="px-2 py-1">
                                            <input 
                                                type="number" 
                                                step="0.1" 
                                                min="0"
                                                value={weekLog[project.id]?.[formatDate(day)] || ''}
                                                onChange={e => handleHourChange(project.id, formatDate(day), e.target.value)}
                                                className="w-full p-1 text-center rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                placeholder="0"
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 font-semibold text-center">{weeklyTotal.toFixed(2)}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end items-center gap-4 mt-4">
                {error && <p className="text-red-500 text-sm">Error: {error}</p>}
                <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300">
                    {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export const TeamProductivityView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [teamLogs, setTeamLogs] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(false);

    const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
    const endOfWeek = useMemo(() => {
        const end = new Date(startOfWeek);
        end.setDate(startOfWeek.getDate() + 4);
        return end;
    }, [startOfWeek]);

    useEffect(() => {
        const fetchLogs = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('productivity_logs')
                .select('editor_name, hours_worked')
                .gte('date', formatDate(startOfWeek))
                .lte('date', formatDate(endOfWeek));
            
            if (data) {
                const summary = data.reduce((acc, log) => {
                    acc[log.editor_name] = (acc[log.editor_name] || 0) + log.hours_worked;
                    return acc;
                }, {} as Record<string, number>);
                setTeamLogs(summary);
            }
            setIsLoading(false);
        };
        fetchLogs();
    }, [startOfWeek]);

    const sortedEditors = useMemo(() => editors.sort((a,b) => (teamLogs[b] || 0) - (teamLogs[a] || 0)), [teamLogs]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="px-3 py-1 bg-white border rounded-md">&larr; Prev Week</button>
                <h3 className="text-lg font-semibold">Week of {startOfWeek.toLocaleDateString()}</h3>
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="px-3 py-1 bg-white border rounded-md">Next Week &rarr;</button>
            </div>
             <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Editor</th>
                            <th className="px-6 py-3">Total Hours Logged</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedEditors.map(editor => (
                            <tr key={editor} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-semibold text-gray-900">{editor}</td>
                                <td className="px-6 py-4">{(teamLogs[editor] || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
};
