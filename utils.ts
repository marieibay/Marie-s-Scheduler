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
    // Updated rule: Any title starting with 'PRH' or 'YA' is a PRH project.
    if (title.startsWith('PRH') || title.startsWith('YA')) return 'PRH';
    // Fallback for other projects, which are treated as PRH by default.
    return 'PRH';
};

export const calculateWhatsLeft = (est_rt: number, total_edited: number): string => {
    const result = (est_rt || 0) - (total_edited || 0);
    // Using Number() strips trailing zeros from the string returned by toFixed() for a cleaner look
    return String(Number(result.toFixed(2)));
};