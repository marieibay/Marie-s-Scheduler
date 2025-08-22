
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';

// --- TYPES (from types.ts) ---
interface Project {
  id: number;
  title: string;
  dueDate: string; // Stored as YYYY-MM-DD
  originalDueDate: string; // Stored as YYYY-MM-DD
  notes: string;
  editor: string;
  editorNote: string;
  pzQc: string;
  pzQcNote: string;
  master: string;
  masterNote: string;
  estRt: number;
  totalEdited: number;
  remainingRaw: number;
  isOnHold: boolean;
  status: 'ongoing' | 'done' | 'archived';
}

type ViewMode = 'manager' | 'editor' | 'client';

// --- EMPLOYEES (from employees.ts) ---
const editors = [
  'Macky', 'Coleen', 'Jason', 'Emerson', 'Rovic', 'Manjo', 'Alan', 'Faye', 
  'Glenn', 'Lorenz', 'Joseph', 'Paulo', 'Miggy', 'Normand', 'Jazz', 'Ace', 
  'Max', 'Jao'
];

const masters = [
  'Poch', 'Bernie', 'Aileen', 'Sae', 'Dan', 'Mico', 'RC', 'Nickie', 
  'Justin', 'Chiqui', 'Jann', 'Tamara', 'Sieg', 'Jancel', 'Ralph'
];

const qcPersonnel = [
  'Jomar', 'Sarah', 'Rein', 'Lauraine'
];


// --- UTILS (from utils.ts) ---
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
    return 'PRH';
};

const calculateWhatsLeft = (estRt: number, totalEdited: number): string => {
    const result = (estRt || 0) - (totalEdited || 0);
    return result.toFixed(2);
};

// Custom Hook to sync state with localStorage and other tabs/windows
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
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

// --- DATA (from data.ts) ---
const projectsData: Omit<Project, 'status' | 'originalDueDate'>[] = [
  // Page 1
  { id: 1, dueDate: '2025-06-09', title: 'PRHA#: Disney Blackstone Reformats [OM] - Sending by batch', pzQc: '', pzQcNote: '', notes: '8/12-8/14 (10a-4:30p) ET', editor: '', editorNote: '', master: 'Aileen', masterNote: '', estRt: 0, totalEdited: 0, remainingRaw: 0, isOnHold: true },
  { id: 2, dueDate: '2025-08-22', title: 'The Whistler', pzQc: 'DONE', pzQcNote: '', notes: '8/15 (10a-2p) ET', editor: 'DONE', editorNote: '', master: 'Dan', masterNote: '', estRt: 10, totalEdited: 10.8, remainingRaw: 0, isOnHold: false },
  { id: 3, dueDate: '2025-08-25', title: 'Hell Bent (Author Read)', pzQc: 'DONE', pzQcNote: '', notes: '8/12-8/13, 8/22 (11am - 5pm) ET', editor: 'DONE', editorNote: '', master: 'Chiquie', masterNote: '', estRt: 6.75, totalEdited: 6.5, remainingRaw: 0, isOnHold: false },
  { id: 4, dueDate: '2025-08-25', title: 'Reflections on Exile (Self Direct)', pzQc: 'DONE', pzQcNote: '', notes: '07/28, 07/29, 07/31-08/01, 08/04-08/05, 08/07-08/08, 08/11-08/12\n08/14-08/15\n(10a-3:30p ET all dates)', editor: 'DONE', editorNote: '', master: 'RC', masterNote: '', estRt: 20, totalEdited: 33.5, remainingRaw: 0, isOnHold: false },
  { id: 5, dueDate: '2025-08-25', title: 'Unicorn Academy: The Winter Solstice', pzQc: 'DONE', pzQcNote: '', notes: 'Recording Start Date 08/18/25\nRecording End Date 08/19/25\nScheduling Notes - Intermittent Dates, Times, etc. 10a-1:30p ET', editor: 'DONE', editorNote: '', master: 'Justin', masterNote: '', estRt: 2.25, totalEdited: 2.4, remainingRaw: 0, isOnHold: false },
  { id: 6, dueDate: '2025-08-27', title: 'A to Z Animal Mysteries #6: Find That Ferret! (Self Direct)', pzQc: 'DONE', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Dan', masterNote: '', estRt: 0.75, totalEdited: 0.75, remainingRaw: 0, isOnHold: false },
  { id: 7, dueDate: '2025-08-22', title: 'Dead & Breakfast (Self Direct)', pzQc: 'DONE', pzQcNote: '', notes: 'Recording Start Date08/13/25\nRecording End Date08/18/25\nScheduling Notes - Intermittent Dates, Times, etc.delivering by EOD 8/18', editor: 'DONE', editorNote: '', master: 'RALPH', masterNote: '', estRt: 9.9, totalEdited: 9.75, remainingRaw: 0, isOnHold: false },
  { id: 8, dueDate: '2025-08-29', title: 'Falling in a Sea of Stars - ROLL', pzQc: 'DONE', pzQcNote: '', notes: '08/04-08/05, 08/07-08/08, 08/11, 08/13-08/15, 08/18-08/20 (10a-4p ET)', editor: 'DONE', editorNote: '', master: 'Chiquie', masterNote: '', estRt: 24, totalEdited: 22.4, remainingRaw: 0, isOnHold: false },
  { id: 9, dueDate: '2025-08-20', title: 'Alchemised (CRASH) - Embargoed (sending by batch)', pzQc: 'Laurain', pzQcNote: '', notes: '8/5-8/8, 8/11-8/12, 8/18-8/22, 8/25-8/27 (11am - 5pm ET) - NEXT 8/18', editor: 'Glenn', editorNote: '', master: 'Mico', masterNote: '', estRt: 36, totalEdited: 21.6, remainingRaw: 5, isOnHold: false },
  { id: 10, dueDate: '2025-08-26', title: 'The Night That Finds Us All', pzQc: 'JOmar', pzQcNote: '', notes: '8/18-8/20 (10a-4:30p ET)', editor: 'Alan', editorNote: '', master: 'Sae', masterNote: '', estRt: 7.5, totalEdited: 7, remainingRaw: 1.8, isOnHold: false },
  { id: 11, dueDate: '2025-08-26', title: 'Sir Callie and the Final Stand (Multiple Narrator)', pzQc: 'Rein', pzQcNote: '', notes: 'Esme Symes-Smith at Shock City Studios [8/21 (11a-12p CT/12p-1p ET)] - Narrating: Main Text\n-Dani Martineck at 1745 #1 [8/18-8/20 (10a-4:30p)] - Narrating: Main Text"', editor: 'Jazz', editorNote: '', master: 'Jancel', masterNote: '', estRt: 9, totalEdited: 6.4, remainingRaw: 3.5, isOnHold: false },
  { id: 12, dueDate: '2025-08-26', title: 'Beyond Wanting (Author Read)', pzQc: 'Sarah', pzQcNote: '', notes: 'Recording Start Date 08/18/25\nRecording End Date 08/20/25\nScheduling Notes - Intermittent Dates, Times, etc. 10am-5pm BST', editor: 'Miggy', editorNote: 'Paulo to edit for today', master: 'Chiquie', masterNote: '', estRt: 7.8, totalEdited: 6.8, remainingRaw: 3.6, isOnHold: false },
  { id: 13, dueDate: '2025-08-27', title: 'Smart Mouth (Author Read)', pzQc: 'Sarah', pzQcNote: '', notes: 'Recording Start Date 07/22/25\nRecording End Date 07/24/25\nScheduling Notes - Intermittent Dates, Times, etc. 10am-5pm ET - Next 8/22', editor: 'Jazz', editorNote: '', master: 'Ralph', masterNote: '', estRt: 8.5, totalEdited: 9.4, remainingRaw: 0, isOnHold: false },
  { id: 14, dueDate: '2025-08-27', title: 'Paper Girl (Author Read)', pzQc: 'Laurain', pzQcNote: '', notes: '8/11, 8/12, 8/14, 8/21 and 8/22 (10a-2p ET) - NEXT 8/21', editor: 'Ace', editorNote: '', master: 'Bernie', masterNote: '', estRt: 9, totalEdited: 5.4, remainingRaw: 2.25, isOnHold: false },
  { id: 15, dueDate: '2025-08-27', title: 'White Widow: Secret Sisters (Self Direct)', pzQc: 'Jomar', pzQcNote: '', notes: '8/19-8/21', editor: 'Joseph (halfday)', editorNote: '', master: 'Dan', masterNote: '', estRt: 8, totalEdited: 4, remainingRaw: 3.5, isOnHold: false },
  { id: 16, dueDate: '2025-08-27', title: 'Colin Gets Promoted and Dooms the World', pzQc: 'Rein', pzQcNote: '', notes: 'Recording Start Date 08/18/25\nRecording End Date 08/22/25\nScheduling Notes - Intermittent Dates, Times, etc. (10a-5p) ET', editor: 'Faye', editorNote: 'Macky to take over', master: 'Nickie', masterNote: '', estRt: 11.5, totalEdited: 5.5, remainingRaw: 4, isOnHold: false },
  { id: 17, dueDate: '2025-08-27', title: 'The Global Forest (Author Read)', pzQc: 'Sarah', pzQcNote: '', notes: '8/18, 8/19, 8/21, 8/22 (10am - 5pm ET) - NEXT 8/23', editor: 'Jao to conttinue', editorNote: '', master: 'Mico', masterNote: '', estRt: 4.8, totalEdited: 1.8, remainingRaw: 2.5, isOnHold: false },
  // Page 2
  { id: 18, dueDate: '2025-08-27', title: 'The Last Supper (Author Read)', pzQc: 'Rein', pzQcNote: '', notes: 'August 19, 20, and 21: 10am - 5pm ET daily', editor: 'Normand', editorNote: 'MAY NEED HELP - When somebody is free, please have them help here', master: 'Aileen', masterNote: 'Somebody check quality and pickups', estRt: 8, totalEdited: 4.25, remainingRaw: 6, isOnHold: false },
  { id: 19, dueDate: '2025-08-27', title: "Ms. Pennypickle's Puzzle Quest", pzQc: 'Rein', pzQcNote: '', notes: 'Recording Start Date08/20/25\nRecording End Date08/21/25\nScheduling Notes - Intermittent Dates, Times, etc. (10a-5p) ET\nSandra Okuboyejo at CDM Sound Studios [07/25/25 07/25/25]-Narrating: Keshia Plummer articles and @CarrotCara social media comment', editor: 'Emerson Jao to edit after his backlog', editorNote: '', master: 'Sieg', masterNote: '', estRt: 5, totalEdited: 1.1, remainingRaw: 4, isOnHold: false },
  { id: 20, dueDate: '2025-08-28', title: 'Heartsick (Multiple Narrator)', pzQc: 'Rein', pzQcNote: '', notes: 'Waiting for other narrators', editor: 'Miggy', editorNote: 'to continue', master: 'JANN', masterNote: '', estRt: 8.5, totalEdited: 7.4, remainingRaw: 0, isOnHold: false },
  { id: 21, dueDate: '2025-08-28', title: 'My Mother, the Mermaid Chaser (Self Direct)', pzQc: 'Jomar', pzQcNote: '', notes: '8/18-8/22', editor: 'Joseph (halfday)', editorNote: '', master: 'RC', masterNote: '', estRt: 10, totalEdited: 7.5, remainingRaw: 1.6, isOnHold: false },
  { id: 22, dueDate: '2025-09-02', title: 'Hole in the Sky (Multiple Narrator)', pzQc: 'Laurain', pzQcNote: '', notes: 'Matt Godfrey at Home Studio [8/12 (8a-10a PT/10a-12p CT)] - Narrating: THE MAN DOWNSTAIRS\n-Sacha Chambers at Voice Trax West [8/11 (10a-5p PT)] - Narrating: MIKAYLA JOHNSON\n-Kholan Studi at Dave & Dave - Burbank [8/27 (10a-5p PT)] - Narrating: JIM HARDGRAY\n-Ari Fliakos at CDM Sound Studios [8/4-8/5 (5:30-8:30 ET)] - Narrating: GAVIN CLARK - NEXT 8/27', editor: 'Joseph to take over', editorNote: '', master: 'Sae', masterNote: '', estRt: 9, totalEdited: 5.5, remainingRaw: 0, isOnHold: false },
  { id: 23, dueDate: '2025-09-02', title: 'Willing Prey (Multiple Narrator)', pzQc: 'Rein', pzQcNote: '', notes: '- Amy Hall: 8/20-8/21 and 8/25, Aaron Shedlock:8/27-8/28 - Updated\n-Janina Edwards at Home Studio [08/11/25-08/11/25] - Narrating: Crystal]\n-Emana Rachelle at CDM Sound Studios [08/16/25-08/16/25] - Narrating: Chevy]\n-Robin Miles at Home Studio [08/29/25-08/29/25] - Narrating: Geneva', editor: 'Lorenz', editorNote: '', master: 'Aileen', masterNote: '', estRt: 9.5, totalEdited: 0, remainingRaw: 4, isOnHold: false },
  { id: 24, dueDate: '2025-09-03', title: 'Fever (Multiple Narrator)', pzQc: 'Sarah', pzQcNote: '', notes: '-Kevin R. Free 8/18 (10am - 5pm) ET @ his home studio - Narrating: Noah - NEXT 8/29', editor: 'Miggy', editorNote: '', master: 'Jancel', masterNote: '', estRt: 7.6, totalEdited: 5, remainingRaw: 0, isOnHold: false },
  { id: 25, dueDate: '2025-09-09', title: 'Fortress of Ambrose (Multiple Narrator)', pzQc: 'Jomar', pzQcNote: '', notes: 'André Santana... Home Studio... 08/15 (10a-5p ET) (reading Yagrin)\nKate Simses ... Dave & Dave ... 08/19 (10a-5p PT), 08/20 (10a-4p PT) (reading Quell)\nMichael Crouch ... Home Studio ... 08/25 (11a-11:30 ET) (reading Ellery)\nDania Vali... LA #3 ... 08/29 (1p-2p PT) (reading Adola)\nCarlotta Brentan Home Studio ... 08/29, 09/01 (9a-3p ET) (reading Nore)\nPhilip Hernandez... Home Studio... 09/03 (11a-11:30a ET) (reading The Dragunhead)\nVikas Adam ... LA #3 ... 09/04 (10a-5p PT) (reading Jordan)', editor: 'Ace', editorNote: 'Ace to continue after Paper Girl', master: 'Mico', masterNote: '', estRt: 16, totalEdited: 6.5, remainingRaw: 2.6, isOnHold: true },
  // Page 3
  { id: 26, dueDate: '2025-09-18', title: 'Selected Letters of John Updike (Multiple Narrator) sending by batch', pzQc: 'Rein', pzQcNote: '', notes: '(Author) James Schiff... Ambient Studios ... 08/14 (2:30 4:30p ET) (reading Introduction + A Note on the Text) (Joseph Grimm direct)\nMiranda Updike, Elizabeth Updike Cobblah, Michael Updike, and David Updike... Mix One ... 8/15 (10a-12p) (John Doolittle direct)\nJeff Ebner ... 1745 #5 ... 08/18-08/22 (Narrating: Updike letters (early years)]) (Joseph Grimm direct)\nKimberly Farr ... Voice Trax West ... 08/28, 9/2 (10a-5p) (Narrating: Footnotes + Chronology) (Joseph Grimm direct)\nJason Culp... Home Studio... 09/08-09/19 (Narrating: Updike Letters (later years)) (Joseph Grimm direct)', editor: 'Coleen', editorNote: 'edit for today', master: 'Bernie', masterNote: '', estRt: 40, totalEdited: 4.25, remainingRaw: 0.8, isOnHold: true },
  { id: 27, dueDate: '2025-09-24', title: 'Under the Oak Tree: Volume 2 (The Novel)', pzQc: 'JOmar', pzQcNote: '', notes: '08/21-08/22, 08/25-08/26, 09/22 (10a-5p PT)\n8/21, 8/28, 8/29, 8/30 (10am-2pm ET), 9/2, 9/3 (10am – 2pm ET), 9/4-9/6 (10am - 5pm ET)', editor: 'Max to start', editorNote: '', master: 'Jann', masterNote: '', estRt: 12, totalEdited: 0, remainingRaw: 2, isOnHold: false },
  { id: 28, dueDate: '2025-09-10', title: 'Conform', pzQc: '', pzQcNote: '', notes: '', editor: '', editorNote: '', master: '', masterNote: '', estRt: 13.5, totalEdited: 0, remainingRaw: 2.8, isOnHold: true },
  { id: 29, dueDate: '2025-07-16', title: 'AUDIBLE: BK_ADBL_064845 - Illusory Gains - Punch', pzQc: 'DONE', pzQcNote: '', notes: 'Waiting for confirmation', editor: 'DONE', editorNote: '', master: 'DONE', masterNote: '', estRt: 12.7, totalEdited: 13, remainingRaw: 0, isOnHold: false },
  { id: 30, dueDate: '2025-07-23', title: 'PODIUM: The Brewing Butcher (Post)', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/6', editor: 'DONE', editorNote: '', master: 'DONE', masterNote: '', estRt: 15, totalEdited: 15.5, remainingRaw: 0, isOnHold: false },
  { id: 31, dueDate: '2025-07-25', title: 'AUDIBLE: BK_ADBL_062424 - American Kings (Edit/QC2)', pzQc: 'DONE', pzQcNote: '', notes: 'QC pack sent', editor: 'DONE', editorNote: '', master: 'Dan', masterNote: '', estRt: 13.35, totalEdited: 11.25, remainingRaw: 0, isOnHold: false },
  { id: 32, dueDate: '2025-07-25', title: 'CURATED AUDIO: Harvesting Rosewater', pzQc: 'DONE', pzQcNote: '', notes: 'Masters Early August', editor: 'DONE', editorNote: '', master: 'Nickie', masterNote: '', estRt: 11, totalEdited: 8.5, remainingRaw: 0, isOnHold: false },
  { id: 33, dueDate: '2025-07-29', title: 'AUDIBLE: BK_ADBL_055175 - The Infernus Gate', pzQc: 'DONE', pzQcNote: '', notes: 'QC pack sent', editor: 'DONE', editorNote: '', master: 'Tamara', masterNote: '', estRt: 0, totalEdited: 3.5, remainingRaw: 0, isOnHold: false },
  { id: 34, dueDate: '2025-07-30', title: 'BK_ADBL_064851 - The Blade That Binds Us', pzQc: 'DONE', pzQcNote: '', notes: 'QC pack sent', editor: 'DONE', editorNote: '', master: 'Nickie', masterNote: '', estRt: 11.85, totalEdited: 12.5, remainingRaw: 0, isOnHold: false },
  { id: 35, dueDate: '2025-08-05', title: 'CURATED AUDIO: Faeries', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/5', editor: 'DONE', editorNote: '', master: 'Sieg', masterNote: '', estRt: 6.5, totalEdited: 6.5, remainingRaw: 0, isOnHold: false },
  { id: 36, dueDate: '2025-08-01', title: 'PODIUM: Dirty Secrets', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/15 - waiting for pickups from 1 narrator', editor: 'DONE', editorNote: '', master: 'Dan', masterNote: '', estRt: 10, totalEdited: 8, remainingRaw: 0, isOnHold: false },
  { id: 37, dueDate: '2025-08-04', title: 'PODIUM: Power Play (Post - Production - Multiple Narrator)', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/18 - Can be delivered', editor: 'DONE', editorNote: '', master: 'DONE', masterNote: '', estRt: 8.31, totalEdited: 8.5, remainingRaw: 0, isOnHold: false },
  { id: 38, dueDate: '2025-08-05', title: 'AUDIBLE: BK_ADBL_063065 - Hunted', pzQc: 'DONE', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Jann', masterNote: '', estRt: 8.3, totalEdited: 8.8, remainingRaw: 0, isOnHold: false },
  { id: 39, dueDate: '2025-08-06', title: 'PODIUM: Country Heat (Post - Multiple Narrator)', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/20', editor: 'DONE', editorNote: '', master: 'Justin', masterNote: '', estRt: 3, totalEdited: 2.5, remainingRaw: 0, isOnHold: false },
  { id: 40, dueDate: '2025-08-08', title: 'PODIUM: The Switched-Up Playbook (Post - Multiple Narrator)', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/22', editor: 'DONE', editorNote: '', master: 'Chiquie', masterNote: '', estRt: 12.5, totalEdited: 10.4, remainingRaw: 0, isOnHold: false },
  { id: 41, dueDate: '', title: 'ONS: Hunting Adeline (Book 2) - Standard Post - Multiple (5) Narrators w/ Line-by-line (PUNCH) + Soundtracking', pzQc: 'Laurain', pzQcNote: '', notes: '', editor: 'Lorenz', editorNote: 'to finish', master: 'aileen', masterNote: '', estRt: 19.25, totalEdited: 17.8, remainingRaw: 1, isOnHold: false },
  // Page 4
  { id: 42, dueDate: '2025-08-11', title: 'Bloomsbury (HOZ): The Blazing Sea (Full Production) Recording/ Post/ QC2 - Roll', pzQc: 'DONE', pzQcNote: '', notes: 'July 28 (Monday) - 10:00 AM to 5:00 PM\nJuly 29 (Tuesday) - 10:00 AM to 5:00 PM\nJuly 30 (Wednesday) - 10:00 AM to 5:00 PM\nJuly 31 (Thursday) - 10:00 AM to 5:00 PM\nAuggust 1 (Friday) - 10:00 AM to 5:00 PM\nAugust 7 (Wednesday) - pickup session', editor: 'DONE', editorNote: '', master: 'Mico', masterNote: '', estRt: 9.57, totalEdited: 8.8, remainingRaw: 0, isOnHold: false },
  { id: 43, dueDate: '2025-08-12', title: "CURATED AUDIO: And I'll Take Out Your Eyes (Post-Production - Single Narrator)", pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/19', editor: 'DONE', editorNote: '', master: 'Bernie', masterNote: '', estRt: 10, totalEdited: 11.4, remainingRaw: 0, isOnHold: false },
  { id: 44, dueDate: '2025-08-12', title: 'AUDIBLE: BK_ADBL_065090 – Beyond Oblivion', pzQc: 'DONE', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Chiquie', masterNote: '', estRt: 12.25, totalEdited: 12.5, remainingRaw: 0, isOnHold: false },
  { id: 45, dueDate: '2025-08-13', title: 'AUDIBLE: BK_ADBL_064146 - Immoral', pzQc: 'DONE', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Sieg', masterNote: '', estRt: 8.71, totalEdited: 7.5, remainingRaw: 0, isOnHold: false },
  { id: 46, dueDate: '2025-08-14', title: 'CURATED: The Shocking Experiments of Miss Mary Bennet (Post Production - Single Narrator) - ROLL', pzQc: 'DONE', pzQcNote: '', notes: 'Finalizing', editor: 'DONE', editorNote: '', master: 'Sieg', masterNote: '', estRt: 12, totalEdited: 9.5, remainingRaw: 0, isOnHold: false },
  { id: 47, dueDate: '2025-08-15', title: 'AUDIBLE: BK_ADBL_065091 Almost Beautiful', pzQc: 'DONE', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Aileen', masterNote: '', estRt: 9.29, totalEdited: 8, remainingRaw: 0, isOnHold: false },
  { id: 48, dueDate: '2025-08-18', title: 'HAY HOUSE: Walking with Your Spirit Totem Animals', pzQc: 'DONE', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Nickie', masterNote: '', estRt: 12.5, totalEdited: 5.4, remainingRaw: 0, isOnHold: false },
  { id: 49, dueDate: '2025-08-15', title: 'PODIUM: Broken Promises - Post - Production (Multiple Narrator)', pzQc: 'DONE', pzQcNote: '', notes: 'Masters by 8/29', editor: 'DONE', editorNote: '', master: 'Bernie', masterNote: '', estRt: 8.8, totalEdited: 7.6, remainingRaw: 0, isOnHold: false },
  { id: 50, dueDate: '2025-08-18', title: 'AUDIBLE: BK_ADBL_065335 He Did Not Conquer (Rush QC1/Edit) - ROLL', pzQc: 'DONE', pzQcNote: '', notes: '8/11-8/15 - RUSHED QC', editor: 'DONE', editorNote: '', master: 'Jann', masterNote: '', estRt: 10.22, totalEdited: 10.1, remainingRaw: 0, isOnHold: false },
  { id: 51, dueDate: '2025-08-19', title: 'Audible: BK_ADBL_065435 - The Remembered Soldier - Punch', pzQc: 'Sarah', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Mico', masterNote: '', estRt: 28.21, totalEdited: 24.5, remainingRaw: 0, isOnHold: false },
  { id: 52, dueDate: '2025-08-20', title: 'AUDIBLE: BK_ADBL_064262 - Devils Desk 3 - Punch', pzQc: 'Sarah', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'RC', masterNote: '', estRt: 11, totalEdited: 11, remainingRaw: 0, isOnHold: false },
  { id: 53, dueDate: '2025-08-20', title: 'AUDIBLE: BK_ADBL_064843 - Illusory Empire (Edit/QC1)', pzQc: 'Jomar', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Nickie', masterNote: '', estRt: 14.57, totalEdited: 15, remainingRaw: 0, isOnHold: false },
  { id: 54, dueDate: '2025-08-22', title: 'AUDIBLE: BK_ADBL_065148 – Project Hometown', pzQc: 'Sarah', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Jann', masterNote: '', estRt: 10.76, totalEdited: 9.6, remainingRaw: 0, isOnHold: false },
  { id: 55, dueDate: '2025-08-25', title: 'HAY HOUSE: The Brain Fitness Blueprint', pzQc: 'Sarah', pzQcNote: '', notes: 'RUSHED', editor: 'Manjo', editorNote: 'to finish', master: 'Dan', masterNote: '', estRt: 10.6, totalEdited: 7.6, remainingRaw: 2, isOnHold: false },
  { id: 56, dueDate: '2025-08-26', title: 'PODIUM: Veal (Post - Production)', pzQc: 'Jomar', pzQcNote: '', notes: 'Masters by 9/9', editor: 'DONE', editorNote: '', master: 'Sieg', masterNote: '', estRt: 8.36, totalEdited: 8.8, remainingRaw: 0, isOnHold: false },
  { id: 57, dueDate: '2025-08-28', title: 'AUDIBLE: BK_ADBL_062415 - The Life of Singleton - PUNCH', pzQc: 'Rein', pzQcNote: '', notes: '', editor: 'Jao', editorNote: '', master: 'Justin', masterNote: '', estRt: 15.62, totalEdited: 7.75, remainingRaw: 5.6, isOnHold: true },
  { id: 58, dueDate: '2025-08-28', title: 'AUDIBLE: BK_ADBL_065536 Wildflowers (Edit/QC1)', pzQc: 'Laurain', pzQcNote: '', notes: '', editor: 'Alan to start after backlog on PRH', editorNote: '', master: 'Bernie', masterNote: '', estRt: 6.8, totalEdited: 0, remainingRaw: 6.8, isOnHold: false },
  { id: 59, dueDate: '2025-09-01', title: "PODIUM: Blitz'd (Post - Multiple Narrator)", pzQc: 'Sarah', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Dan', masterNote: '', estRt: 10.19, totalEdited: 7.6, remainingRaw: 5, isOnHold: false },
  { id: 60, dueDate: '2025-09-02', title: 'AUDIBLE: BK_ADBL_064046 - The Numbered Empire (Punch)', pzQc: 'Jomar', pzQcNote: '', notes: '', editor: 'DONE', editorNote: '', master: 'Sieg', masterNote: '', estRt: 21.94, totalEdited: 21.8, remainingRaw: 0, isOnHold: false },
  { id: 61, dueDate: '2025-09-03', title: 'ONS: The Defender - DUET(Standard Post - Punch) Multiple Narrator w/ Line-by-Line', pzQc: 'Laurain', pzQcNote: '', notes: '', editor: 'Macky', editorNote: '', master: 'Chiquie', masterNote: '', estRt: 10.64, totalEdited: 6.8, remainingRaw: 5, isOnHold: true },
  { id: 62, dueDate: '2025-09-08', title: 'HAY HOUSE: Soul Mastery (Post Production)', pzQc: 'Jomar', pzQcNote: '', notes: '', editor: 'Alan', editorNote: '', master: 'Jancel', masterNote: '', estRt: 9.6, totalEdited: 0, remainingRaw: 8.6, isOnHold: true },
  { id: 63, dueDate: '2025-09-16', title: 'AUDIBLE: BK_ADBL_063306 - Gold Medal Marine - PUNCH', pzQc: 'Jomar', pzQcNote: '', notes: '', editor: 'Rovic', editorNote: '', master: 'Mico', masterNote: '', estRt: 10.95, totalEdited: 1, remainingRaw: 6, isOnHold: true },
  { id: 64, dueDate: '2025-09-19', title: 'PODIUM: Tyrant - Post Prod (Multiple Narrator)', pzQc: 'Rein', pzQcNote: '', notes: '', editor: 'Jazz', editorNote: '', master: 'Sieg', masterNote: '', estRt: 0, totalEdited: 0, remainingRaw: 3.4, isOnHold: true },
  // Page 5
  { id: 65, dueDate: '2025-09-02', title: 'AUDIBLE: BK_ADBL_064139 - Only Rogue Actions', pzQc: '', pzQcNote: '', notes: '', editor: 'Manjo to start next week instead', editorNote: '', master: '', masterNote: '', estRt: 6, totalEdited: 0, remainingRaw: 3.5, isOnHold: false },
  { id: 66, dueDate: '2025-08-27', title: 'ANATOLE STUDIO: Alchemised [French Audiobook] (Edit Only)', pzQc: '', pzQcNote: '', notes: 'Need another batch for delivery today', editor: 'Jason', editorNote: 'Rovic to edit today', master: '', masterNote: '', estRt: 37, totalEdited: 23.8, remainingRaw: 12.5, isOnHold: false },
  { id: 67, dueDate: '2025-08-27', title: 'ANATOLE: Dernier train pour Kamakura [French Audiobook] (Multiple Narrator) (Edit only) (RUSH)', pzQc: '', pzQcNote: '', notes: '', editor: 'Faye', editorNote: '', master: '', masterNote: '', estRt: 7, totalEdited: 0, remainingRaw: 2, isOnHold: false },
];

const initialProjects: Project[] = projectsData.map(p => {
    const baseProject = {
        ...p,
        originalDueDate: p.dueDate // Set originalDueDate from initial dueDate
    };

    if (p.editor === 'DONE') {
        return { ...baseProject, status: 'done', editor: '' };
    }
    return { ...baseProject, status: 'ongoing' };
});

// --- COMPONENTS (from components.tsx) ---

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
        if (!dueDate) return 'MM/DD/YY';
        try {
            const date = new Date(dueDate + 'T00:00:00');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${month}/${day}/${year}`;
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
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    
    const filteredOptions = useMemo(() =>
        options.filter(option =>
            option.toLowerCase().includes((value || '').toLowerCase())
        ), [options, value]
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
        if (!isOpen) setIsOpen(true);
        setHighlightedIndex(-1);
    };

    const handleOptionClick = (option: string) => {
        onChange(option);
        setIsOpen(false);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
                break;
            case 'Enter':
                if (highlightedIndex >= 0) {
                    e.preventDefault();
                    handleOptionClick(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    return (
        <div 
            className="relative w-full" 
            onBlur={handleBlur}
        >
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={isOpen}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul 
                    className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto"
                    role="listbox"
                >
                    {filteredOptions.map((option, index) => (
                        <li
                            key={option}
                            className={`px-3 py-2 cursor-pointer ${index === highlightedIndex ? 'bg-indigo-100' : 'hover:bg-indigo-50'}`}
                            onClick={() => handleOptionClick(option)}
                            role="option"
                            aria-selected={index === highlightedIndex}
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

                <div className="flex flex-col md:flex-row md:items-start md:gap-6">
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
                    <div className="flex flex-row flex-wrap justify-start gap-2 pt-4 md:pt-0 flex-shrink-0">
                        <div className="bg-blue-50 p-2 rounded-lg w-24 text-center">
                            <input type="number" step="0.01" value={project.estRt} onChange={(e) => handleUpdate('estRt', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-blue-800 text-center ${INLINE_INPUT_CLASS}`}/>
                            <p className="text-xs text-blue-600 mt-1">EST RT</p>
                        </div>
                        <div className="bg-yellow-50 p-2 rounded-lg w-24 text-center">
                            <input type="number" step="0.01" value={project.totalEdited} onChange={(e) => handleUpdate('totalEdited', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-yellow-800 text-center ${INLINE_INPUT_CLASS}`}/>
                            <p className="text-xs text-yellow-600 mt-1">Edited</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg w-24 text-center">
                            <p className="font-bold text-lg text-green-800 h-9 flex items-center justify-center">{whatsLeft} hrs</p>
                            <p className="text-xs text-green-600 mt-1">What's Left</p>
                        </div>
                        <div className="bg-purple-50 p-2 rounded-lg w-24 text-center">
                            <input type="number" step="0.01" value={project.remainingRaw} onChange={(e) => handleUpdate('remainingRaw', parseFloat(e.target.value) || 0)} className={`font-bold text-lg text-purple-800 text-center ${INLINE_INPUT_CLASS}`}/>
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


// --- APP COMPONENTS (from App.tsx) ---

// --- EDITOR PAGE COMPONENT (replaces editor.tsx) ---
const EditorPage: React.FC = () => {
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
    
    return (
      <div className="container mx-auto p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Audiobook Production Dashboard</h1>
                <p className="text-gray-600">Editor Workflow</p>
            </div>
            <a href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors text-sm font-semibold">
                &larr; Back to Manager Dashboard
            </a>
        </header>
        <main>
          <EditorView projects={editorProjects} onUpdate={handleUpdateProjectField} />
        </main>
      </div>
    );
};

// --- MANAGER DASHBOARD COMPONENT (original App component logic) ---
const ManagerDashboard: React.FC = () => {
    const [projects, setProjects] = useLocalStorage<Project[]>('projects', initialProjects);
    const [viewMode, setViewMode] = useState<ViewMode>('manager');
    const [currentPage, setCurrentPage] = useState<'ongoing' | 'done' | 'archived'>('ongoing');
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    const ongoingProjects = useMemo(() => projects.filter(p => p.status === 'ongoing'), [projects]);
    const doneProjects = useMemo(() => projects.filter(p => p.status === 'done'), [projects]);
    const archivedProjects = useMemo(() => projects.filter(p => p.status === 'archived'), [projects]);
    
    const handleSwitchView = (mode: ViewMode) => {
        if (mode === 'editor') {
            window.history.pushState({}, '', '/editor');
            const navEvent = new PopStateEvent('popstate');
            window.dispatchEvent(navEvent);
        } else {
            setViewMode(mode);
        }
    };

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
      setProjects(prev => [newProject, ...prev]);
      setCurrentPage('ongoing');
    }, [setProjects]);

    const handleUpdateProjectField = useCallback((id: number, field: keyof Project, value: string | number | boolean) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    }, [setProjects]);
    
    const handleSortByDate = useCallback(() => {
        setProjects(prevProjects => {
            const currentProjects = prevProjects.filter(p => p.status === currentPage);
            const otherProjects = prevProjects.filter(p => p.status !== currentPage);

            const sortedCurrent = [...currentProjects].sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });

            return [...sortedCurrent, ...otherProjects];
        });
    }, [currentPage, setProjects]);

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
    }, [projectToDelete, setProjects]);

    const renderCurrentView = () => {
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
                                <button onClick={handleAddNewProject} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-transform duration-150 ease-in-out active:scale-95 active:bg-indigo-800 flex items-center">
                                    <PlusIcon />
                                    <span className="hidden sm:inline">Add Project</span>
                                </button>
                            )}
                        </div>
                    </header>
    
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setCurrentPage('ongoing')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'ongoing' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Ongoing Edits</button>
                                    <button onClick={() => setCurrentPage('done')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'done' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Edit Done</button>
                                    <button onClick={() => setCurrentPage('archived')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${currentPage === 'archived' ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>Archived Projects</button>
                                </div>
                                {viewMode === 'manager' && (
                                    <button onClick={handleSortByDate} className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm">
                                        Sort by Date
                                    </button>
                                 )}
                            </div>
        
                            <div className="flex items-center gap-4 sm:ml-auto">
                                <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
                                    <span className="text-sm font-medium hidden sm:block px-2">View Mode:</span>
                                    <button onClick={() => handleSwitchView('manager')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'manager' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Manager</button>
                                    <button onClick={() => handleSwitchView('client')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors ${viewMode === 'client' ? 'bg-white text-indigo-700' : 'bg-transparent text-gray-700'}`}>Client</button>
                                    <button onClick={() => handleSwitchView('editor')} className={`px-3 py-1 rounded-md text-sm shadow-sm transition-colors bg-transparent text-gray-700`}>Editor</button>
                                </div>
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

// --- MAIN ROUTER COMPONENT ---
const App: React.FC = () => {
    const [route, setRoute] = useState(window.location.pathname);

    useEffect(() => {
        const onLocationChange = () => {
            setRoute(window.location.pathname);
        };
        window.addEventListener('popstate', onLocationChange);
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);

    if (route === '/editor' || route === '/editor.html') {
        return <EditorPage />;
    }
    return <ManagerDashboard />;
};


// --- RENDER THE APP ---

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
