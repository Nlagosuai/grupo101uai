export interface Review {
    id: string;
    bank: string;
    rating: string;
    comment: string;
    date: string;
    categories: string[];
}

export interface BankInfo {
    name: string;
    url: string;
    responseTime: string;
    statusCode: number;
    statusText: string;
    state: "active" | "inactive";
    icon: string;
}

export interface BankConfig {
    name: string;
    url: string;
    icon: string;
}

// Types for Monthly Benefits
export interface Benefit {
    id: string; // Unique ID for the benefit
    name: string; // Short name or title of the benefit
    description: string; // Detailed description of the benefit
    category: string; // e.g., "travel", "food", "discounts", "cashback"
    bankAssociation?: string; // Optional: if the benefit is tied to a specific bank
    validFrom?: string; // ISO 8601 date string
    validTo?: string; // ISO 8601 date string
    detailsUrl?: string; // Link to more details
    termsAndConditions?: string; // Key terms or link to them
}

export interface MonthlyBenefit {
    year: number; // e.g., 2024
    month: number; // 1 (Jan) to 12 (Dec)
    benefits: Benefit[]; // List of benefits for this month
    lastUpdated: string; // ISO 8601 datetime string when this month's benefits were last updated
}

// Structure to store all monthly benefits, perhaps in a service or database
// For in-memory storage example:
// export type BenefitsArchive = MonthlyBenefit[];
// Or, if indexed by year-month string (e.g., "2024-01"):
// export type BenefitsArchive = Record<string, MonthlyBenefit>; 