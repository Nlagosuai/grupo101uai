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