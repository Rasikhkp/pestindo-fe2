export type Customer = {
    id: number;
    code: string;
    type: string;
    name: string;
    phone: string;
    total_jobs: number;
};

export type Job = {
    job_id: number;
    type: "residency" | "commercial";
    start_date: string;
    end_date: string;
    status: "pending" | "on_progress" | "canceled" | "finished";
    contract_value: number;
};
