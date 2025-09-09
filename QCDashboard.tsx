import React, { useState, useMemo, useEffect } from 'react';
import { Project, QCProductivityLog } from './types';
import { qcPersonnel } from './employees';
import { QCProjectLoggerDashboard, QCPersonalStatsView, QCTeamProductivityView } from './qc_components';

interface QCDashboardProps {
    projects: Project[];
    qcLogs: QCProductivityLog[];
}

export const QCDashboard: React.FC<QCDashboardProps> = ({ projects, qcLogs }) => {
    const [activeTab, setActiveTab] = useState('logHours');
    const [selectedQC, setSelectedQC] = useState<string>(() => {
        return localStorage.getItem('selectedQC') || (qcPersonnel.length > 0 ? qcPersonnel[0] : '');
    });

    useEffect(() => {
        localStorage.setItem('selectedQC', selectedQC);
    }, [selectedQC]);

    const activeProjectsForQC = useMemo(() => {
        return [...projects]
            .filter(p => p.status === 'ongoing' || p.status === 'done')
            .sort((a, b) => a.title.localeCompare(b.title));
    }, [projects]);

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="sticky top-0 z-20 w-full bg-gray-100/95 backdrop-blur-sm border-b border-gray-200">
                <div className="container mx-auto px-4 md:px-8">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center pt-8 pb-4 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                            <p className="text-gray-600">QC Workflow</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label htmlFor="qc-select" className="text-sm font-medium text-gray-700">Viewing as:</label>
                            <select
                                id="qc-select"
                                value={selectedQC}
                                onChange={e => setSelectedQC(e.target.value)}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                                {qcPersonnel.map(qc => <option key={qc} value={qc}>{qc}</option>)}
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
                {activeTab === 'logHours' && <QCProjectLoggerDashboard projects={activeProjectsForQC} allLogs={qcLogs} selectedQC={selectedQC} />}
                {activeTab === 'myStats' && <QCPersonalStatsView allLogs={qcLogs} selectedQC={selectedQC} projects={projects} />}
                {activeTab === 'teamProductivity' && <QCTeamProductivityView />}
            </main>
        </div>
    );
};