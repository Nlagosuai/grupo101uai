import type { Benefit, MonthlyBenefit } from '../types.ts';
import { DB_BENEFITS_FILE } from '../config.ts'; // Assuming a config for a potential DB file

// In-memory store for monthly benefits.
// This will be loaded from a file and saved back to it.
let monthlyBenefitsData: MonthlyBenefit[] = [];

/**
 * Generates a unique ID for benefits.
 */
function generateBenefitId(): string {
    return crypto.randomUUID();
}

/**
 * Loads benefits from a JSON file into memory.
 * If the file doesn't exist, it starts with an empty array.
 */
async function loadBenefitsFromFile(): Promise<void> {
    try {
        const fileContent = await Deno.readTextFile(DB_BENEFITS_FILE);
        monthlyBenefitsData = JSON.parse(fileContent) as MonthlyBenefit[];
        console.log(`Benefits loaded from ${DB_BENEFITS_FILE}`);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.warn(`${DB_BENEFITS_FILE} not found. Starting with empty benefits data.`);
            monthlyBenefitsData = [];
        } else {
            console.error('Error loading benefits from file:', error);
            monthlyBenefitsData = []; // Start fresh in case of other errors
        }
    }
}

/**
 * Saves the current in-memory benefits data to a JSON file.
 */
async function saveBenefitsToFile(): Promise<void> {
    try {
        await Deno.writeTextFile(DB_BENEFITS_FILE, JSON.stringify(monthlyBenefitsData, null, 2));
        console.log(`Benefits saved to ${DB_BENEFITS_FILE}`);
    } catch (error) {
        console.error('Error saving benefits to file:', error);
    }
}

// Initialize by loading benefits when the service starts.
// The await here means this module will wait for benefits to load before anything else can be imported from it.
// This might not be ideal for all server setups, consider lazy loading or explicit init function if needed.
await loadBenefitsFromFile();

/**
 * Gets all benefits for a specific year and month.
 * If no benefits exist for that month, returns an empty array for benefits.
 */
export function getBenefitsForMonth(year: number, month: number): MonthlyBenefit | undefined {
    return monthlyBenefitsData.find(mb => mb.year === year && mb.month === month);
}

/**
 * Adds a new benefit to a specific year and month.
 * If the month doesn't exist, it creates it.
 */
export async function addBenefitToMonth(
    year: number,
    month: number,
    benefitData: Omit<Benefit, 'id'>
): Promise<Benefit> {
    let monthBenefits = monthlyBenefitsData.find(mb => mb.year === year && mb.month === month);

    const newBenefit: Benefit = {
        ...benefitData,
        id: generateBenefitId(),
    };

    if (monthBenefits) {
        monthBenefits.benefits.push(newBenefit);
        monthBenefits.lastUpdated = new Date().toISOString();
    } else {
        monthBenefits = {
            year,
            month,
            benefits: [newBenefit],
            lastUpdated: new Date().toISOString(),
        };
        monthlyBenefitsData.push(monthBenefits);
    }

    // Sort monthlyBenefitsData by year and month for consistency
    monthlyBenefitsData.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
    });

    await saveBenefitsToFile();
    return newBenefit;
}

/**
 * Edits an existing benefit.
 */
export async function editBenefitInMonth(
    year: number,
    month: number,
    benefitId: string,
    benefitUpdateData: Partial<Omit<Benefit, 'id'>>
): Promise<Benefit | null> {
    const monthBenefits = monthlyBenefitsData.find(mb => mb.year === year && mb.month === month);
    if (!monthBenefits) {
        return null; // Month not found
    }

    const benefitIndex = monthBenefits.benefits.findIndex(b => b.id === benefitId);
    if (benefitIndex === -1) {
        return null; // Benefit not found
    }

    // Update the benefit
    monthBenefits.benefits[benefitIndex] = {
        ...monthBenefits.benefits[benefitIndex],
        ...benefitUpdateData,
    };
    monthBenefits.lastUpdated = new Date().toISOString();

    await saveBenefitsToFile();
    return monthBenefits.benefits[benefitIndex];
}

/**
 * Deletes a benefit from a specific year and month.
 */
export async function deleteBenefitFromMonth(
    year: number,
    month: number,
    benefitId: string
): Promise<boolean> {
    const monthBenefits = monthlyBenefitsData.find(mb => mb.year === year && mb.month === month);
    if (!monthBenefits) {
        return false; // Month not found
    }

    const initialLength = monthBenefits.benefits.length;
    monthBenefits.benefits = monthBenefits.benefits.filter(b => b.id !== benefitId);

    if (monthBenefits.benefits.length < initialLength) {
        monthBenefits.lastUpdated = new Date().toISOString();
        // Optional: if a month has no benefits, remove the month entry itself
        // if (monthBenefits.benefits.length === 0) {
        //     monthlyBenefitsData = monthlyBenefitsData.filter(mb => !(mb.year === year && mb.month === month));
        // }
        await saveBenefitsToFile();
        return true; // Benefit deleted
    }

    return false; // Benefit not found or not deleted
}

/**
 * Retrieves all stored monthly benefits.
 * Useful for admin interfaces or a full overview.
 */
export function getAllMonthlyBenefits(): MonthlyBenefit[] {
    return [...monthlyBenefitsData]; // Return a copy
} 