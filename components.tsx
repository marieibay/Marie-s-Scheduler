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

const NoteIcon: React.FC<{ hasNote?: boolean, className?: string }> = ({ hasNote, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className || "h-4 w-4"} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule={hasNote ? "evenodd" : "nonzero"} />
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

const TrashIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const CalculatorIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 4a1 1 0 000 2h6a1 1 0 100-2H7zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 3a1 1 0 000 2h2a1 1 0 100-2H8z" clipRule="evenodd" />
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

// Helper for debouncing
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

// Hours Breakdown Tooltip
const HoursBreakdownTooltip: React.FC<{ breakdown?: Record<string, number> }> = ({ breakdown }) => {
    if (!breakdown) return null;

    const sortedEditors = Object.keys(breakdown).sort((a, b) => breakdown[b] - breakdown[a]);

    if (sortedEditors.length === 0) {
        return null;
    }

    return (
        <div className="absolute z-20 w-48 p-2 text-sm font-normal text-left text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -translate-x-1/2 left-1/2 -top-2 translate-y-[-100%]">
            <h4 className="font-semibold mb-1 border-b pb-1">Hours Breakdown</h4>
            <ul className="space-y-1 mt-2">
                {sortedEditors.map(editor => (
                    <li key={editor} className="flex justify-between">
                        <span>{editor}:</span>
                        <strong>{breakdown[editor].toFixed(2)}h</strong>
                    </li>
                ))}
            </ul>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-200"></div>
        </div>
    );
};

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

// Delete Log Row Confirmation Modal
interface DeleteLogRowConfirmationModalProps {
    editorName: string;
    projectName: string;
    onConfirm: () => void;
    onCancel: () => void;
}
export const DeleteLogRowConfirmationModal: React.FC<DeleteLogRowConfirmationModalProps> = ({ editorName, projectName, onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
        <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Time Logs</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                        Are you sure you want to delete all of <strong>{editorName}</strong>'s logged hours for "<strong>{projectName}</strong>" for this week?
                    </p>
                </div>
                <div className="items-center px-4 py-3 space-x-4">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700">Confirm Delete</button>
                </div>
            </div>
        </div>
    </div>
);

// Historical Correction Modal
interface HistoricalCorrectionModalProps {
    project: Project;
    onSave: (hours: number) => void;
    onClose: () => void;
}
const HistoricalCorrectionModal: React.FC<HistoricalCorrectionModalProps> = ({ project, onSave, onClose }) => {
    const [hours, setHours] = useState('');
    
    const handleSave = () => {
        const numericHours = parseFloat(hours);
        if (!isNaN(numericHours) && numericHours >= 0) {
            onSave(numericHours);
            onClose();
        } else {
            alert("Please enter a valid, non-negative number for the hours.");
        }
    };
    
    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <CalculatorIcon className="h-6 w-6 text-blue-600"/>
                    </div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Correct Historical Hours</h3>
                    <p className="text-sm text-gray-500 mt-2 px-4">For project: <strong>{project.title}</strong></p>
                    <div className="mt-4 px-7 py-3">
                        <label htmlFor="historical-hours" className="block text-sm font-medium text-gray-700 text-left mb-1">
                            Enter the correct total edited hours
                        </label>
                        <input
                            type="number"
                            id="historical-hours"
                            value={hours}
                            onChange={(e) => setHours(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            placeholder="e.g., 8.5"
                        />
                         <p className="text-xs text-gray-400 mt-2 text-left">This will create a historical adjustment log to make the project's total match the value you enter. Any new hours logged will be added to this corrected total.</p>
                    </div>
                    <div className="items-center px-4 py-3 space-x-4">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">Save Correction</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Due Date Display with Alerts
interface DueDateDisplayProps {
    due_date: string | null;
    original_due_date: string | null;
    onUpdate: (newDate: string | null) => void;
    isReadOnly?: boolean;
}

export const DueDateDisplay: React.FC<DueDateDisplayProps> = ({ due_date, original_due_date, onUpdate, isReadOnly = false }) => {
    const [isEditing, setIsEditing] = useState(false);
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
        if (isEditing && !isReadOnly) {
            dateInputRef.current?.focus();
            try {
                // This is a progressive enhancement to open the picker automatically on supported browsers.
                dateInputRef.current?.showPicker();
            } catch (e) {
                // Silently fail if not supported.
            }
        }
    }, [isEditing, isReadOnly]);

    const handleDisplayClick = (e: React.MouseEvent) => {
        if (isReadOnly) return;
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        onUpdate(newDate || null);
        setIsEditing(false);
    };
    
    const handleBlur = () => {
        setIsEditing(false);
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
                 <input
                    ref={dateInputRef}
                    type="date"
                    value={formatDateForNativePicker(due_date)}
                    onChange={handleDateChange}
                    onBlur={handleBlur}
                    className="p-1 border border-indigo-400 rounded-md shadow-sm"
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
    onHistoricalCorrection: (projectId: number, hours: number) => Promise<void>;
    isClientView?: boolean;
    isNewEditColumnMissing?: boolean;
    productivityBreakdown?: Record<string, number>;
}
export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate, onDelete, onHistoricalCorrection, isClientView = false, isNewEditColumnMissing = false, productivityBreakdown }) => {
    const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
    
    const handleUpdate = (field: keyof Project, value: any) => onUpdate(project.id, field, value);
    
    const calculatedTotalEdited = useMemo(() => {
        if (!productivityBreakdown) return 0;
        // Fix for error on line 713 and 716. Explicitly set the generic type for `reduce` to `number` to ensure correct type inference for `calculatedTotalEdited`.
        return Object.values(productivityBreakdown).reduce<number>((sum, hours) => sum + hours, 0);
    }, [productivityBreakdown]);

    const renderStatusButtons = () => {
        switch (project.status) {
            case 'ongoing': return <button onClick={() => handleUpdate('status', 'done')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-green-500 text-white hover:bg-green-600">Mark as Done</button>;
            case 'done': return (
                <>
                    <button onClick={() => handleUpdate('status', 'ongoing')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-blue-500 text-white hover:bg-blue-600">Re-open</button>
                    <button onClick={() => handleUpdate('status', 'archived')} className="px-3 py-1 text-xs font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap bg-gray-500 text-white hover:bg-gray-600">Archive</button>
                </>
            );
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
        <>
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
                             onClick={() => setIsCorrectionModalOpen(true)}
                             title="Correct historical hours for this project"
                             className="p-1.5 rounded-full text-gray-400 hover:bg-blue-100 hover:text-blue-600"
                        >
                            <CalculatorIcon />
                        </button>
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
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">Editor:</strong><div className="flex-grow">{renderField(project.editor, 'editor', editors, 'Name...')}</div></div>
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">Master:</strong><div className="flex-grow">{renderField(project.master, 'master', masters, 'Name...')}</div></div>
                        <div className="flex items-center gap-2"><strong className="text-gray-600 w-16 shrink-0 text-right">PZ QC:</strong><div className="flex-grow">{renderField(project.pz_qc, 'pz_qc', qcPersonnel, 'Name...')}</div></div>
                    </div>
                    <div className="flex flex-row flex-wrap justify-start gap-2 pt-4 md:pt-0 flex-shrink-0">
                        <div className="bg-blue-50 p-2 rounded-lg w-24 text-center">
                            {renderNumberField(project.est_rt, 'est_rt')}
                            <p className="text-xs text-blue-600 mt-1">EST RT</p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded-lg w-24 text-center relative group">
                            <p className="font-bold text-lg text-yellow-800 text-center h-9 flex items-center justify-center">{calculatedTotalEdited.toFixed(2)}</p>
                            <p className="text-xs text-yellow-600 mt-1">Edited</p>
                            <HoursBreakdownTooltip breakdown={productivityBreakdown} />
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg w-24 text-center">
                            <p className="font-bold text-lg text-green-800 h-9 flex items-center justify-center">{calculateWhatsLeft(project.est_rt, calculatedTotalEdited)}</p>
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
        {isCorrectionModalOpen && (
            <HistoricalCorrectionModal
                project={project}
                onClose={() => setIsCorrectionModalOpen(false)}
                onSave={(hours) => onHistoricalCorrection(project.id, hours)}
            />
        )}
        </>
    );
};

// --- VIEW COMPONENTS ---

interface ViewProps {
    projects: Project[];
    onUpdate: (id: number, field: keyof Project, value: any) => void;
    onDelete?: (project: Project) => void;
    onHistoricalCorrection: (projectId: number, hours: number) => Promise<void>;
    isNewEditColumnMissing?: boolean;
    productivityByProject?: Record<number, Record<string, number>>;
}

export const ManagerView: React.FC<ViewProps> = ({ projects, onUpdate, onDelete, onHistoricalCorrection, isNewEditColumnMissing, productivityByProject }) => {
    if (projects.length === 0) return <div className="text-center text-gray-500 py-10">No projects to display in this category.</div>;
    return (
        <div className="space-y-4">
            {projects.map(project => (
// Fix: Changed prop name from 'productivityByProject' to 'productivityBreakdown' to match ProjectCardProps.
                <ProjectCard key={project.id} project={project} onUpdate={onUpdate} onDelete={onDelete} onHistoricalCorrection={onHistoricalCorrection} isClientView={false} isNewEditColumnMissing={isNewEditColumnMissing} productivityBreakdown={productivityByProject?.[project.id]} />
            ))}
        </div>
    );
};

export const ClientView: React.FC<Omit<ViewProps, 'onDelete'>> = ({ projects, onUpdate, onHistoricalCorrection, productivityByProject }) => {
    if (projects.length === 0) return <div className="text-center text-gray-500 py-10">No projects to display in this category.</div>;
    return (
        <div className="space-y-4">
            {projects.map(project => (
// Fix: Changed prop name from 'productivityByProject' to 'productivityBreakdown' to match ProjectCardProps.
                 <ProjectCard key={project.id} project={project} onUpdate={onUpdate} onHistoricalCorrection={onHistoricalCorrection} isClientView={true} productivityBreakdown={productivityByProject?.[project.id]} />
            ))}
        </div>
    );
};

export const EditorView: React.FC<Omit<ViewProps, 'onDelete' | 'onHistoricalCorrection'>> = ({ projects, onUpdate, productivityByProject }) => {
    const handleUpdate = (id: number, field: keyof Project, value: any) => onUpdate(id, field, value);

    if (projects.length === 0) return <div className="text-center text-gray-500 py-10">You have no ongoing projects assigned.</div>;
    
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
                    {projects.map((project) => {
                        const productivityBreakdown = productivityByProject?.[project.id];
                        const calculatedTotalEdited = Object.values(productivityBreakdown || {}).reduce((sum: number, h: number) => sum + h, 0);

                        return (
                            <tr key={project.id} className={`border-b hover:bg-gray-50 ${project.is_on_hold ? 'bg-pink-100' : 'bg-white'}`}>
                                <td className="px-6 py-4 font-semibold text-gray-900">{getClientName(project)}</td>
                                <td className="px-6 py-4">{project.title}</td>
                                <td className="px-6 py-4">
                                   <DueDateDisplay due_date={project.due_date} original_due_date={project.original_due_date} onUpdate={(newDate) => handleUpdate(project.id, 'due_date', newDate)} isReadOnly={true} />
                                </td>
                                <td className="px-6 py-4 font-semibold">{project.editor}</td>
                                <td className="px-6 py-4 text-center">{project.est_rt}</td>
                                <td className="px-6 py-4 relative group text-center">
                                    {calculatedTotalEdited.toFixed(2)}
                                    <HoursBreakdownTooltip breakdown={productivityByProject?.[project.id]} />
                                </td>
                                <td className="px-6 py-4 font-semibold text-center">{calculateWhatsLeft(project.est_rt, calculatedTotalEdited)}</td>
                                <td className="px-6 py-4 w-32">
                                   <input type="number" step="0.01" value={project.remaining_raw ?? ''} onChange={(e) => handleUpdate(project.id, 'remaining_raw', parseFloat(e.target.value) || 0)} className="w-full p-1 rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                                </td>
                            </tr>
                        );
                    })}
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
  // This robust method is immune to timezone issues.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekDays = (startOfWeek: Date): Date[] => {
  return Array.from({ length: 5 }).map((_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });
};

const NotePopover: React.FC<{
    note: string | null;
    onSave: (note: string) => void;
    onClose: () => void;
}> = ({ note, onSave, onClose }) => {
    const [text, setText] = useState(note || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    const handleBlur = () => {
        onSave(text);
        onClose();
    };

    return (
        <div className="absolute z-20 bottom-full mb-2 w-56 -translate-x-1/2 left-1/2">
            <div className="p-2 bg-white border border-gray-300 rounded-lg shadow-lg">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={handleBlur}
                    placeholder="Add a note..."
                    className="w-full h-24 p-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none"
                />
            </div>
        </div>
    );
};

const DailyLogInput: React.FC<{
    hours: string;
    note: string | null;
    onHoursChange: (hours: string) => void;
    onNoteChange: (note: string) => void;
    disabled?: boolean;
}> = ({ hours, note, onHoursChange, onNoteChange, disabled }) => {
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const hasNote = useMemo(() => note && note.trim().length > 0, [note]);
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const handleIconClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsNoteOpen(true);
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isNoteOpen && wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsNoteOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNoteOpen]);

    return (
        <div className="relative flex items-center" ref={wrapperRef}>
            <input
                type="text"
                inputMode="decimal"
                value={hours}
                onChange={e => onHoursChange(e.target.value)}
                className="w-full p-1.5 text-center rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="0"
                disabled={disabled}
            />
            {!disabled && (
                <button
                    onClick={handleIconClick}
                    title={hasNote ? note! : "Add note"}
                    className={`absolute right-1 p-0.5 rounded-full transition-colors ${hasNote ? 'text-indigo-600' : 'text-gray-300 hover:text-gray-600'}`}
                >
                    <NoteIcon hasNote={hasNote} />
                </button>
            )}
            {isNoteOpen && (
                <NotePopover
                    note={note}
                    onSave={onNoteChange}
                    onClose={() => setIsNoteOpen(false)}
                />
            )}
        </div>
    );
};

const TimeLogEntryRow: React.FC<{
    editorName: string;
    isNew: boolean;
    weekDays: Date[];
    punchOrRoll: 'P' | 'R' | '';
    projectLogs: Record<string, { hours: string; note: string | null }>;
    onLogChange: (editorName: string, date: string, hours: string, note: string | null) => void;
    onPunchRollChange: (editorName: string, value: 'P' | 'R' | '') => void;
    onDeleteRow: (editorName: string) => void;
}> = ({ editorName, isNew, weekDays, punchOrRoll, projectLogs, onLogChange, onPunchRollChange, onDeleteRow }) => {
    const [selectedEditor, setSelectedEditor] = useState(editorName);

    const handleHourChange = (date: string, value: string) => {
        if (!selectedEditor && isNew) {
            alert("Please select an editor first.");
            return;
        }
        onLogChange(selectedEditor, date, value, projectLogs[date]?.note || null);
    };
    
    const handleNoteChange = (date: string, note: string) => {
        if (!selectedEditor && isNew) {
            alert("Please select an editor first.");
            return;
        }
        onLogChange(selectedEditor, date, projectLogs[date]?.hours || '0', note);
    };

    const handleEditorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newEditor = e.target.value;
        if(isNew) setSelectedEditor(newEditor);
    };
    
    const handlePRChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
         if (!selectedEditor && isNew) {
            alert("Please select an editor first.");
            return;
        }
        onPunchRollChange(selectedEditor, e.target.value as 'P' | 'R' | '');
    };

    return (
         <tr className={isNew ? "bg-gray-50" : "bg-white"}>
            <td className="px-2 py-2 w-1/4">
                {isNew ? (
                     <select value={selectedEditor} onChange={handleEditorChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">Select Editor...</option>
                        {editors.sort().map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                ) : (
                    <span className="font-semibold text-gray-800">{editorName}</span>
                )}
            </td>
            <td className="px-2 py-2">
                 <select value={punchOrRoll} onChange={handlePRChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm" disabled={isNew && !selectedEditor}>
                    <option value=""></option>
                    <option value="P">P</option>
                    <option value="R">R</option>
                </select>
            </td>
            {weekDays.map(day => {
                const dateStr = formatDate(day);
                return (
                    <td key={dateStr} className="px-1 py-1">
                        <DailyLogInput
                            hours={projectLogs[dateStr]?.hours || ''}
                            note={projectLogs[dateStr]?.note || null}
                            onHoursChange={(hours) => handleHourChange(dateStr, hours)}
                            onNoteChange={(note) => handleNoteChange(dateStr, note)}
                            disabled={isNew && !selectedEditor}
                        />
                    </td>
                );
            })}
            <td className="px-2 py-2 font-semibold text-center text-gray-700">
                {Object.values(projectLogs).reduce((acc: number, log: { hours: string; }) => acc + (parseFloat(log.hours) || 0), 0).toFixed(2)}
            </td>
            <td className="px-2 py-2 text-center w-12">
                {!isNew && (
                    <button 
                        onClick={() => onDeleteRow(editorName)} 
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                        title={`Delete all logs for ${editorName} this week`}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                )}
            </td>
        </tr>
    );
};

const ProjectTimeLogCard: React.FC<{
    project: Project;
    allLogs: ProductivityLog[];
    weekDays: Date[];
    selectedEditor: string;
    onUpdateProjectField: (id: number, field: keyof Project, value: string | number | boolean) => void;
}> = ({ project, allLogs, weekDays, selectedEditor, onUpdateProjectField }) => {
    const [isOpen, setIsOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [editorToDelete, setEditorToDelete] = useState<string | null>(null);
    
    const projectLogsForWeek = useMemo(() => {
        const fromDate = formatDate(weekDays[0]);
        const toDate = formatDate(weekDays[4]);
        return allLogs.filter(log => log.project_id === project.id && log.date >= fromDate && log.date <= toDate);
    }, [allLogs, project.id, weekDays]);
    
    const logsByEditorAndDay = useMemo(() => {
        const result = projectLogsForWeek.reduce((acc, log) => {
            if (!acc[log.editor_name]) {
                acc[log.editor_name] = {};
            }
            acc[log.editor_name][log.date] = { hours_worked: log.hours_worked, log_note: log.log_note, punch_or_roll: log.punch_or_roll };
            return acc;
        }, {} as Record<string, Record<string, Partial<ProductivityLog>>>);

        if (project.editor && !result[project.editor]) {
           result[project.editor] = {};
        }

        return result;
    }, [projectLogsForWeek, project.editor]);
    
    const [localLogs, setLocalLogs] = useState<Record<string, Record<string, { hours: string; note: string | null }>>>({});
    const [punchRollValues, setPunchRollValues] = useState<Record<string, 'P' | 'R' | ''>>({});
    const [localRaw, setLocalRaw] = useState<string>(String(project.remaining_raw ?? ''));

    useEffect(() => {
        if (!cardRef.current?.contains(document.activeElement)) {
            const newLogs: Record<string, Record<string, { hours: string; note: string | null }>> = {};
            const newPRs: Record<string, 'P' | 'R' | ''> = {};
            
            for (const editor in logsByEditorAndDay) {
                newLogs[editor] = {};
                let prValue: 'P' | 'R' | '' = '';
                for (const date in logsByEditorAndDay[editor]) {
                    const log = logsByEditorAndDay[editor][date];
                    newLogs[editor][date] = {
                        hours: String(log.hours_worked || ''),
                        note: log.log_note || null,
                    };
                    if (log.punch_or_roll) {
                        prValue = log.punch_or_roll;
                    }
                }
                newPRs[editor] = prValue;
            }
            setLocalLogs(newLogs);
            setPunchRollValues(newPRs);
        }
    }, [logsByEditorAndDay]);

    useEffect(() => {
        if (!cardRef.current?.contains(document.activeElement)) {
            setLocalRaw(String(project.remaining_raw ?? ''));
        }
    }, [project.remaining_raw]);
    
    const debouncedSaveLog = useRef(debounce(async (editorName: string, date: string, hours: number, note: string | null, punchOrRoll: 'P' | 'R' | '') => {
        const upsertData: Omit<ProductivityLog, 'id'> = {
            project_id: project.id,
            editor_name: editorName,
            date,
            hours_worked: hours,
            log_note: note,
            punch_or_roll: punchOrRoll || null
        };
        
        if (hours > 0 || (note && note.trim())) {
            await supabase.from('productivity_logs').upsert(upsertData, { onConflict: 'editor_name,project_id,date' });
        } else {
            await supabase.from('productivity_logs').delete().match({ project_id: project.id, editor_name: editorName, date });
        }
    }, 750)).current;

    const debouncedSaveRaw = useRef(debounce((value: number) => {
        onUpdateProjectField(project.id, 'remaining_raw', value);
    }, 750)).current;

    const handleLogChange = (editorName: string, date: string, hoursString: string, note: string | null) => {
        setLocalLogs(prev => {
            const newLogs = JSON.parse(JSON.stringify(prev));
            if (!newLogs[editorName]) newLogs[editorName] = {};
            if (!newLogs[editorName][date]) newLogs[editorName][date] = { hours: '', note: null };
            newLogs[editorName][date] = { hours: hoursString, note };
            return newLogs;
        });

        const hours = parseFloat(hoursString);
        const currentPR = punchRollValues[editorName] || '';
        
        if (!isNaN(hours) || (note && note.trim())) {
            debouncedSaveLog(editorName, date, isNaN(hours) ? 0 : hours, note, currentPR);
        } else if (hoursString === '' || hoursString === '.') {
            debouncedSaveLog(editorName, date, 0, note, currentPR);
        }
    };
    
    const handlePunchRollChange = async (editorName: string, value: 'P' | 'R' | '') => {
        setPunchRollValues(prev => ({ ...prev, [editorName]: value }));
        
        const fromDate = formatDate(weekDays[0]);
        const toDate = formatDate(weekDays[4]);

        const { error } = await supabase
            .from('productivity_logs')
            .update({ punch_or_roll: value || null })
            .match({ project_id: project.id, editor_name: editorName })
            .gte('date', fromDate)
            .lte('date', toDate);

        if (error) {
            alert(`Failed to update Punch/Roll status: ${error.message}`);
        }
    };

    const handleRawUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalRaw(value);
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) debouncedSaveRaw(numericValue);
        else if (value === '' || value === '.') debouncedSaveRaw(0);
    };

    const handleDeleteRequest = (editorName: string) => setEditorToDelete(editorName);

    const handleConfirmDeleteLogs = async () => {
        if (!editorToDelete) return;
        const fromDate = formatDate(weekDays[0]);
        const toDate = formatDate(weekDays[4]);
        const { error } = await supabase
            .from('productivity_logs')
            .delete()
            .match({ project_id: project.id, editor_name: editorToDelete })
            .gte('date', fromDate)
            .lte('date', toDate);
        if (error) alert(`Failed to delete logs: ${error.message}`);
        setEditorToDelete(null);
    };

    // Fix for error on line 918. Explicitly typing the accumulator `sum` to ensure correct type inference for `projectTotalForWeek`.
    const projectTotalForWeek = projectLogsForWeek.reduce((sum: number, log) => sum + log.hours_worked, 0);

    const canEditRaw = useMemo(() => {
        if (project.editor === selectedEditor) {
            return true;
        }
        return allLogs.some(log => log.project_id === project.id && log.editor_name === selectedEditor);
    }, [project.id, project.editor, selectedEditor, allLogs]);

    return (
        <div className="bg-white rounded-lg shadow transition-shadow hover:shadow-md" ref={cardRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 text-left flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-lg text-gray-800 truncate" title={project.title}>{project.title}</h3>
                    <p className="text-sm text-gray-500">Main Editor: {project.editor || 'Unassigned'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="font-semibold text-indigo-600 text-xl">{projectTotalForWeek.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-500 block">logged this week</span>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-200">
                    {canEditRaw && (
                        <div className="flex items-center gap-2 mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                             <label htmlFor={`raw-${project.id}`} className="text-sm font-semibold text-indigo-800">Remaining RAW:</label>
                             <input
                                id={`raw-${project.id}`}
                                type="text"
                                inputMode="decimal"
                                value={localRaw}
                                onChange={handleRawUpdate}
                                className="w-24 p-1.5 text-center rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             />
                        </div>
                    )}
                     <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                             <tr>
                                <th className="px-2 py-3 text-left w-1/4">Editor</th>
                                <th className="px-2 py-3 text-left w-20">P/R</th>
                                {weekDays.map(day => <th key={day.toISOString()} className="px-1 py-3 text-center w-24">{day.toLocaleDateString('en-US', { weekday: 'short' })}</th>)}
                                <th className="px-2 py-3 text-center">Total</th>
                                <th className="px-2 py-3 text-center w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(logsByEditorAndDay).sort().map(editorName => (
                                <TimeLogEntryRow 
                                    key={editorName}
                                    editorName={editorName}
                                    isNew={false}
                                    weekDays={weekDays}
                                    punchOrRoll={punchRollValues[editorName] || ''}
                                    projectLogs={localLogs[editorName] || {}}
                                    onLogChange={handleLogChange}
                                    onPunchRollChange={handlePunchRollChange}
                                    onDeleteRow={handleDeleteRequest}
                                />
                            ))}
                            <TimeLogEntryRow 
                                editorName=""
                                isNew={true}
                                weekDays={weekDays}
                                punchOrRoll=""
                                projectLogs={{}}
                                onLogChange={handleLogChange}
                                onPunchRollChange={handlePunchRollChange}
                                onDeleteRow={() => {}}
                            />
                        </tbody>
                    </table>
                </div>
            )}
            {editorToDelete && (
                <DeleteLogRowConfirmationModal
                    editorName={editorToDelete}
                    projectName={project.title}
                    onConfirm={handleConfirmDeleteLogs}
                    onCancel={() => setEditorToDelete(null)}
                />
            )}
        </div>
    );
};

export const ProjectLoggerDashboard: React.FC<{
    projects: Project[];
    allLogs: ProductivityLog[];
    selectedEditor: string;
    onUpdateProjectField: (id: number, field: keyof Project, value: string | number | boolean) => void;
}> = ({ projects, allLogs, selectedEditor, onUpdateProjectField }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startOfWeek = useMemo(() => getStartOfWeek(currentDate), [currentDate]);
    const weekDays = useMemo(() => getWeekDays(startOfWeek), [startOfWeek]);

    if (projects.length === 0) {
        return <div className="text-center text-gray-500 py-10">There are no ongoing projects to log time against.</div>;
    }

    return (
         <div className="space-y-4">
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg sticky top-0 z-10">
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="px-3 py-1 bg-white border rounded-md shadow-sm hover:bg-gray-100">&larr; Prev Week</button>
                <h3 className="text-lg font-semibold">Week of {startOfWeek.toLocaleDateString()}</h3>
                <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="px-3 py-1 bg-white border rounded-md shadow-sm hover:bg-gray-100">Next Week &rarr;</button>
            </div>
            <div className="space-y-3">
            {projects.map(project => (
                <ProjectTimeLogCard
                    key={project.id}
                    project={project}
                    allLogs={allLogs}
                    weekDays={weekDays}
                    selectedEditor={selectedEditor}
                    onUpdateProjectField={onUpdateProjectField}
                />
            ))}
            </div>
        </div>
    );
}

export const PersonalStatsView: React.FC<{ allLogs: ProductivityLog[]; selectedEditor: string; projects: Project[] }> = ({ allLogs, selectedEditor, projects }) => {
    const [timeframe, setTimeframe] = useState<'week' | 'month' | 'today'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());

    const projectMap = useMemo(() => 
        projects.reduce((acc, p) => {
            acc[p.id] = p.title;
            return acc;
        }, {} as Record<number, string>),
    [projects]);

    const { filteredLogs, dateRangeLabel } = useMemo(() => {
        const now = new Date(currentDate);
        now.setHours(0, 0, 0, 0);

        let startDate: Date;
        let endDate: Date;
        let label: string;

        switch (timeframe) {
            case 'today':
                startDate = new Date(now);
                endDate = new Date(now);
                label = now.toLocaleDateString();
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                label = `${startDate.toLocaleString('default', { month: 'long' })} ${startDate.getFullYear()}`;
                break;
            case 'week':
            default:
                startDate = getStartOfWeek(now);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6); // Use full 7 days for filtering
                label = `Week of ${startDate.toLocaleDateString()}`;
                break;
        }
        
        endDate.setHours(23, 59, 59, 999);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const logs = allLogs.filter(log =>
            log.editor_name === selectedEditor &&
            log.date >= startStr &&
            log.date <= endStr
        );

        return { filteredLogs: logs, dateRangeLabel: label };
    }, [allLogs, selectedEditor, timeframe, currentDate]);

    const totalHours = useMemo(() =>
        filteredLogs.reduce((sum, log) => sum + log.hours_worked, 0),
    [filteredLogs]);

    const projectBreakdown = useMemo(() => {
        const breakdown = filteredLogs.reduce((acc, log) => {
            const title = projectMap[log.project_id] || `Project ID: ${log.project_id}`;
            if (!acc[title]) {
                acc[title] = { hours: 0, notes: [] };
            }
            acc[title].hours += log.hours_worked;
            if (log.log_note && log.log_note.trim()) {
                acc[title].notes.push(log.log_note);
            }
            return acc;
        }, {} as Record<string, { hours: number; notes: string[] }>);
        
        return Object.entries(breakdown).sort(([, dataA], [, dataB]) => (dataB as { hours: number }).hours - (dataA as { hours: number }).hours);
    }, [filteredLogs, projectMap]);

    const dailyBreakdown = useMemo(() => {
        if (timeframe !== 'week') return [];

        const startOfWeek = getStartOfWeek(new Date(currentDate));
        const weekDays = getWeekDays(startOfWeek);

        const dailyTotals = weekDays.map(date => ({
            date,
            hours: 0,
        }));

        for (const log of filteredLogs) {
            const logDateStr = log.date; // This is 'YYYY-MM-DD'
            const matchingDay = dailyTotals.find(d => formatDate(d.date) === logDateStr);
            if (matchingDay) {
                matchingDay.hours += log.hours_worked;
            }
        }

        return dailyTotals;
    }, [filteredLogs, timeframe, currentDate]);
    
    const handleDateChange = (direction: 'prev' | 'next') => {
        const d = new Date(currentDate);
        const increment = direction === 'next' ? 1 : -1;
        if (timeframe === 'week') d.setDate(d.getDate() + (7 * increment));
        else if (timeframe === 'month') d.setMonth(d.getMonth() + increment);
        else d.setDate(d.getDate() + increment);
        setCurrentDate(d);
    };

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg gap-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => setTimeframe('today')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${timeframe === 'today' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200 border'}`}>Today</button>
                    <button onClick={() => setTimeframe('week')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${timeframe === 'week' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200 border'}`}>This Week</button>
                    <button onClick={() => setTimeframe('month')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${timeframe === 'month' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200 border'}`}>This Month</button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleDateChange('prev')} className="px-3 py-1 bg-white border rounded-md shadow-sm hover:bg-gray-100">&larr; Prev</button>
                    <h3 className="text-lg font-semibold text-center">{dateRangeLabel}</h3>
                    <button onClick={() => handleDateChange('next')} className="px-3 py-1 bg-white border rounded-md shadow-sm hover:bg-gray-100">Next &rarr;</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-white p-6 rounded-lg shadow-md flex flex-col justify-center items-center">
                    <p className="text-gray-500 text-lg">Total Hours Logged</p>
                    <p className="text-5xl font-bold text-indigo-600">{totalHours.toFixed(2)}</p>
                </div>
                <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h4 className="text-xl font-bold mb-4 border-b pb-2">Project Breakdown</h4>
                    {projectBreakdown.length > 0 ? (
                         <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {projectBreakdown.map(([title, data]) => (
                                <li key={title} className="flex flex-col text-sm p-2 rounded-md hover:bg-gray-50">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-700">{title}</span>
                                        <span className="font-bold text-gray-900">{data.hours.toFixed(2)} hrs</span>
                                    </div>
                                    {data.notes.length > 0 && (
                                        <ul className="mt-1 pl-4 list-disc list-inside">
                                            {data.notes.map((note, index) => (
                                                <li key={index} className="text-xs text-gray-500 italic">
                                                    {note}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hours logged for this period.</p>
                    )}
                </div>
                {timeframe === 'week' && (
                    <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-md">
                        <h4 className="text-xl font-bold mb-4 border-b pb-2">Daily Output</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                            {dailyBreakdown.map(({ date, hours }) => (
                                <div key={date.toISOString()} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="font-semibold text-gray-700">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                    <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-2">{hours.toFixed(2)}</p>
                                    <p className="text-xs text-gray-500">hrs</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export const TeamProductivityView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    interface TeamLogSummary {
        total: number;
        punch: number;
        roll: number;
    }
    const [teamLogs, setTeamLogs] = useState<Record<string, TeamLogSummary>>({});
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    const { dateRange, label } = useMemo(() => {
        const d = new Date(currentDate);
        if (viewMode === 'week') {
            const start = getStartOfWeek(d);
            const end = new Date(start);
            end.setDate(start.getDate() + 6); // Full week for logs
            return {
                dateRange: { start, end },
                label: `Week of ${start.toLocaleDateString()}`
            };
        } else { // month
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            return {
                dateRange: { start, end },
                label: `${start.toLocaleString('default', { month: 'long' })} ${start.getFullYear()}`
            }
        }
    }, [currentDate, viewMode]);

    useEffect(() => {
        const fetchLogs = async () => {
            const { data } = await supabase
                .from('productivity_logs')
                .select('editor_name, hours_worked, punch_or_roll')
                .gte('date', formatDate(dateRange.start))
                .lte('date', formatDate(dateRange.end));
            
            if (data) {
                const summary = data.reduce((acc, log) => {
                    const editor = log.editor_name;
                    if (!acc[editor]) {
                        acc[editor] = { total: 0, punch: 0, roll: 0 };
                    }
                    acc[editor].total += log.hours_worked;
                    if (log.punch_or_roll === 'P') {
                        acc[editor].punch += log.hours_worked;
                    } else if (log.punch_or_roll === 'R') {
                        acc[editor].roll += log.hours_worked;
                    }
                    return acc;
                }, {} as Record<string, TeamLogSummary>);
                setTeamLogs(summary);
            }
        };
        fetchLogs();
    }, [dateRange]);
    
    const handleDateChange = (direction: 'prev' | 'next') => {
        const d = new Date(currentDate);
        const increment = direction === 'next' ? 1 : -1;
        if (viewMode === 'week') d.setDate(d.getDate() + (7 * increment));
        else d.setMonth(d.getMonth() + increment);
        setCurrentDate(d);
    };

    const sortedEditors = useMemo(() => editors.sort((a,b) => (teamLogs[b]?.total || 0) - (teamLogs[a]?.total || 0)), [teamLogs]);
    
    const totals = useMemo(() => {
        // Fix for errors on lines 1413-1415. Explicitly typing the accumulator `acc` to resolve 'unknown' type and allow property access.
        return Object.values(teamLogs).reduce((acc: TeamLogSummary, log: TeamLogSummary) => {
            acc.total += log.total;
            acc.punch += log.punch;
            acc.roll += log.roll;
            return acc;
        }, { total: 0, punch: 0, roll: 0 });
    }, [teamLogs]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-3 rounded-lg gap-4">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setViewMode('week')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'week' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200 border'}`}>Weekly</button>
                    <button onClick={() => setViewMode('month')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${viewMode === 'month' ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-200 border'}`}>Monthly</button>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleDateChange('prev')} className="px-3 py-1 bg-white border rounded-md shadow-sm hover:bg-gray-100">&larr; Prev</button>
                    <h3 className="text-lg font-semibold text-center">{label}</h3>
                    <button onClick={() => handleDateChange('next')} className="px-3 py-1 bg-white border rounded-md shadow-sm hover:bg-gray-100">Next &rarr;</button>
                </div>
            </div>
             <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h4 className="text-lg font-semibold text-gray-800">Total Team Hours</h4>
                        <p className="text-sm text-gray-500">For {viewMode === 'week' ? 'this week' : 'this month'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold text-indigo-600">{totals.total.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            <span className="font-semibold">Punch:</span> {totals.punch.toFixed(2)} hrs / <span className="font-semibold">Roll:</span> {totals.roll.toFixed(2)} hrs
                        </p>
                    </div>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">Editor</th>
                                <th className="px-6 py-3 text-right">Punch Hours</th>
                                <th className="px-6 py-3 text-right">Roll Hours</th>
                                <th className="px-6 py-3 text-right">Total Hours</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedEditors.map(editor => {
                                const logs = teamLogs[editor] || { total: 0, punch: 0, roll: 0 };
                                return (
                                <tr key={editor} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{editor}</td>
                                    <td className="px-6 py-4 font-medium text-gray-700 text-right">{logs.punch.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-700 text-right">{logs.roll.toFixed(2)}</td>
                                    <td className="px-6 py-4 font-bold text-lg text-right">{logs.total.toFixed(2)}</td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};