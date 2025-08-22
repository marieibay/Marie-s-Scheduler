
import { useState, useEffect } from 'react';
import { Project } from './types';

export const getClientName = (project: Project): string => {
    const title = project.title.toUpperCase();
    if (title.startsWith('AUDIBLE:')) return 'AUDIBLE';
    if (title.startsWith('PODIUM:')) return 'PODIUM';
    if (title.startsWith('CURATED')) return 'CURATED AUDIO';
    if (title.startsWith('HAY HOUSE:')) return 'HAY HOUSE';
    if (title.startsWith('ONS:')) return 'ONS';
    if (title.startsWith('ANATOLE')) return 'ANATOLE';
    if (title.startsWith('BLOOMSBURY')) return 'Bloomsbury';
    if (title.startsWith('PRHA#:')) return 'PRH';
    return 'PRH';
};

export const calculateWhatsLeft = (estRt: number, totalEdited: number): string => {
    const result = (estRt || 0) - (totalEdited || 0);
    return result.toFixed(2);
};

// Custom Hook to sync state with localStorage and other tabs/windows
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === key && e.newValue) {
                try {
                    setStoredValue(JSON.parse(e.newValue));
                } catch (error) {
                    console.error(error);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [key]);

    return [storedValue, setValue];
}
