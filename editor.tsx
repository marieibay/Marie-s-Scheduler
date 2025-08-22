
import React, { useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { Project } from './types';
import { initialProjects } from './data';
import { EditorView } from './components';
import { useLocalStorage } from './utils';

const EditorApp: React.FC = () => {
    const [projects, setProjects] = useLocalStorage<Project[]>('projects', initialProjects);

    const handleUpdateProjectField = useCallback((id: number, field: keyof Project, value: string | number | boolean) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, [setProjects]);

    const editorProjects = useMemo(() => {
        return [...projects]
          .filter(p => p.status === 'ongoing')
          .sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          });
    }, [projects]);

    const isManagerView = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('view') === 'manager';
    }, []);
    
    return (
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                <p className="text-gray-600">Editor Workflow</p>
            </div>
            {isManagerView && (
                <a href="/index.html" className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-semibold">
                    &larr; Back to Manager Dashboard
                </a>
            )}
        </header>
        <main>
          <EditorView projects={editorProjects} onUpdate={handleUpdateProjectField} />
        </main>
      </div>
    );
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <EditorApp />
  </React.StrictMode>
);
