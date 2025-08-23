
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

export const calculateWhatsLeft = (est_rt: number, total_edited: number): string => {
    const result = (est_rt || 0) - (total_edited || 0);
    return result.toFixed(2);
};
