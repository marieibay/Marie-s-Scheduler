import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Project, QCProductivityLog } from './types';
import { qcPersonnel } from './employees';
import { supabase } from './supabaseClient';


const TrashIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

// Helper for debouncing
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>): void => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), waitFor);
  };
}


// --- QC PRODUCTIVITY COMPONENTS ---

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

const QCTimeLogEntryRow: React.FC<{
    qcName: string;
    isNew: boolean;
    weekDays: Date[];
    projectLogs: Record<string, string>; // Values are now strings
    onLogChange: (qcName: string, date: string, hoursString: string) => void;
    onDeleteRow: (qcName: string) => void;
}> = ({ qcName, isNew, weekDays, projectLogs, onLogChange, onDeleteRow }) => {
    const [selectedQC, setSelectedQC] = useState(qcName);
    
    const handleHourChange = (date: string, value: string) => {
        if(!selectedQC && isNew) {
            alert("Please select a QC person first.");
            return;
        }
        onLogChange(selectedQC, date, value);
    };

    const handleQCChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newQC = e.target.value;
        setSelectedQC(newQC);
    };
    
    return (
         <tr className={isNew ? "bg-gray-50" : "bg-white"}>
            <td className="px-2 py-2 w-1/4">
                {isNew ? (
                     <select value={selectedQC} onChange={handleQCChange} className="w-full p-1.5 border border-gray-300 rounded-md text-sm">
                        <option value="">Select QC...</option>
                        {qcPersonnel.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                ) : (
                    <span className="font-semibold text-gray-800">{qcName}</span>
                )}
            </td>
            {weekDays.map(day => {
                const dateStr = formatDate(day);
                return (
                    <td key={dateStr} className="px-1 py-1">
                        <input
                            type="text"
                            inputMode="decimal"
                            value={projectLogs[dateStr] || ''}
                            onChange={e => handleHourChange(dateStr, e.target.value)}
                            className="w-full p-1.5 text-center rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                            disabled={isNew && !selectedQC}
                        />
                    </td>
                );
            })}
            <td className="px-2 py-2 font-semibold text-center text-gray-700">
                {Object.values(projectLogs).reduce((acc, h) => acc + (parseFloat(h) || 0), 0).toFixed(2)}
            </td>
            <td className="px-2 py-2 text-center w-12">
                {!isNew && (
                    <button 
                        onClick={() => onDeleteRow(qcName)} 
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                        title={`Delete all logs for ${qcName} this week`}
                    >
                        <TrashIcon className="h-4 w-4" />
                    </button>
                )}
            </td>
        </tr>
    );
};

const QCProjectTimeLogCard: React.FC<{
    project: Project;
    allLogs: QCProductivityLog[];
    weekDays: Date[];
    selectedQC: string;
}> = ({ project, allLogs, weekDays, selectedQC }) => {
    const [isOpen, setIsOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    
    const projectLogsForWeek = useMemo(() => {
        const fromDate = formatDate(weekDays[0]);
        const toDate = formatDate(weekDays[4]);
        return allLogs.filter(log => log.project_id === project.id && log.date >= fromDate && log.date <= toDate);
    }, [allLogs, project.id, weekDays]);
    
    const logsByQC = useMemo(() => {
        const byQC = projectLogsForWeek.reduce((acc, log) => {
            if (!acc[log.qc_name]) {
                acc[log.qc_name] = {};
            }
            acc[log.qc_name][log.date] = log.hours_worked;
            return acc;
        }, {} as Record<string, Record<string, number>>);
        
        // If the current user is the assigned QC for this project and hasn't logged time,
        // add an empty entry for them so their row appears automatically.
        if (selectedQC && project.pz_qc === selectedQC && !byQC[selectedQC]) {
            byQC[selectedQC] = {};
        }

        return byQC;
    }, [projectLogsForWeek, project.pz_qc, selectedQC]);

    const [localLogs, setLocalLogs] = useState<Record<string, Record<string, string>>>(() => {
        const initial: Record<string, Record<string, string>> = {};
        for (const qc in logsByQC) {
            initial[qc] = {};
            for (const date in logsByQC[qc]) {
                initial[qc][date] = String(logsByQC[qc][date]);
            }
        }
        return initial;
    });

    useEffect(() => {
        if (!cardRef.current?.contains(document.activeElement)) {
            const newLogs: Record<string, Record<string, string>> = {};
            for (const qc in logsByQC) {
                newLogs[qc] = {};
                for (const date in logsByQC[qc]) {
                    newLogs[qc][date] = String(logsByQC[qc][date]);
                }
            }
            setLocalLogs(newLogs);
        }
    }, [logsByQC]);

    const debouncedSaveLog = useRef(debounce(async (qcName: string, date: string, hours: number) => {
        const upsertData: QCProductivityLog = {
            project_id: project.id,
            qc_name: qcName,
            date,
            hours_worked: hours
        };
        
        if (hours > 0) {
            const { error } = await supabase.from('qc_productivity_logs').upsert(upsertData, { onConflict: 'project_id,qc_name,date' });
            if (error) console.error('Error saving QC log:', error.message);
        } else {
            const { error } = await supabase.from('qc_productivity_logs').delete().match({ project_id: project.id, qc_name: qcName, date });
            if (error) console.error('Error deleting QC log:', error.message);
        }
    }, 750)).current;

    const handleLogChange = (qcName: string, date: string, hoursString: string) => {
        setLocalLogs(prev => {
            const newLogs = JSON.parse(JSON.stringify(prev));
            if (!newLogs[qcName]) newLogs[qcName] = {};
            newLogs[qcName][date] = hoursString;
            return newLogs;
        });

        const hours = parseFloat(hoursString);
        if (!isNaN(hours)) {
            debouncedSaveLog(qcName, date, hours);
        } else if (hoursString === '' || hoursString === '.') {
            debouncedSaveLog(qcName, date, 0);
        }
    };
    
    const handleDeleteRow = async (qcName: string) => {
        const fromDate = formatDate(weekDays[0]);
        const toDate = formatDate(weekDays[4]);

        const { error } = await supabase
            .from('qc_productivity_logs')
            .delete()
            .match({ project_id: project.id, qc_name: qcName })
            .gte('date', fromDate)
            .lte('date', toDate);

        if (error) alert(`Failed to delete logs: ${error.message}`);
    };

    const projectTotalForWeek = projectLogsForWeek.reduce((sum, log) => sum + log.hours_worked, 0);

    return (
        <div className="bg-white rounded-lg shadow transition-shadow hover:shadow-md" ref={cardRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 text-left flex justify-between items-center">
                <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-bold text-lg text-gray-800 truncate" title={project.title}>{project.title}</h3>
                    <p className="text-sm text-gray-500">PZ QC: {project.pz_qc || 'Unassigned'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="font-semibold text-indigo-600 text-xl">{projectTotalForWeek.toFixed(2)} hrs</span>
                    <span className="text-sm text-gray-500 block">logged this week</span>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-200">
                     <table className="w-full text-sm">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                             <tr>
                                <th className="px-2 py-3 text-left">QC</th>
                                {weekDays.map(day => <th key={day.toISOString()} className="px-1 py-3 text-center w-20">{day.toLocaleDateString('en-US', { weekday: 'short' })}</th>)}
                                <th className="px-2 py-3 text-center">Total</th>
                                <th className="px-2 py-3 text-center w-12"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(localLogs).sort().map(qcName => (
                                <QCTimeLogEntryRow 
                                    key={qcName}
                                    qcName={qcName}
                                    isNew={false}
                                    weekDays={weekDays}
                                    projectLogs={localLogs[qcName]}
                                    onLogChange={handleLogChange}
                                    onDeleteRow={handleDeleteRow}
                                />
                            ))}
                            <QCTimeLogEntryRow 
                                qcName=""
                                isNew={true}
                                weekDays={weekDays}
                                projectLogs={{}}
                                onLogChange={handleLogChange}
                                onDeleteRow={() => {}}
                            />
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export const QCProjectLoggerDashboard: React.FC<{
    projects: Project[];
    allLogs: QCProductivityLog[];
    selectedQC: string;
}> = ({ projects, allLogs, selectedQC }) => {
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
                <QCProjectTimeLogCard
                    key={project.id}
                    project={project}
                    allLogs={allLogs}
                    weekDays={weekDays}
                    selectedQC={selectedQC}
                />
            ))}
            </div>
        </div>
    );
}

export const QCPersonalStatsView: React.FC<{ allLogs: QCProductivityLog[]; selectedQC: string; projects: Project[] }> = ({ allLogs, selectedQC, projects }) => {
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
                endDate.setDate(startDate.getDate() + 6);
                label = `Week of ${startDate.toLocaleDateString()}`;
                break;
        }
        
        endDate.setHours(23, 59, 59, 999);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const logs = allLogs.filter(log =>
            log.qc_name === selectedQC &&
            log.date >= startStr &&
            log.date <= endStr
        );

        return { filteredLogs: logs, dateRangeLabel: label };
    }, [allLogs, selectedQC, timeframe, currentDate]);

    const totalHours = useMemo(() =>
        filteredLogs.reduce((sum, log) => sum + log.hours_worked, 0),
    [filteredLogs]);

    const projectBreakdown = useMemo(() => {
        const breakdown = filteredLogs.reduce((acc, log) => {
            const title = projectMap[log.project_id] || `Project ID: ${log.project_id}`;
            acc[title] = (acc[title] || 0) + log.hours_worked;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(breakdown).sort(([, hoursA], [, hoursB]) => hoursB - hoursA);
    }, [filteredLogs, projectMap]);
    
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
                            {projectBreakdown.map(([title, hours]) => (
                                <li key={title} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">{title}</span>
                                    <span className="font-bold text-gray-900">{hours.toFixed(2)} hrs</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hours logged for this period.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


export const QCTeamProductivityView: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [teamLogs, setTeamLogs] = useState<Record<string, number>>({});
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    const { dateRange, label } = useMemo(() => {
        const d = new Date(currentDate);
        if (viewMode === 'week') {
            const start = getStartOfWeek(d);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
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
                .from('qc_productivity_logs')
                .select('qc_name, hours_worked')
                .gte('date', formatDate(dateRange.start))
                .lte('date', formatDate(dateRange.end));
            
            if (data) {
                const summary = data.reduce((acc, log) => {
                    acc[log.qc_name] = (acc[log.qc_name] || 0) + log.hours_worked;
                    return acc;
                }, {} as Record<string, number>);
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

    const sortedQC = useMemo(() => qcPersonnel.sort((a,b) => (teamLogs[b] || 0) - (teamLogs[a] || 0)), [teamLogs]);
    
    const totalHours = useMemo(() => {
        return Object.values(teamLogs).reduce((sum, hours) => sum + hours, 0);
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
                    <p className="text-3xl font-bold text-indigo-600">{totalHours.toFixed(2)}</p>
                </div>

                <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 380px)' }}>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">QC</th>
                                <th className="px-6 py-3">Total Hours Logged</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedQC.map(qc => (
                                <tr key={qc} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{qc}</td>
                                    <td className="px-6 py-4 font-bold text-lg">{(teamLogs[qc] || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};