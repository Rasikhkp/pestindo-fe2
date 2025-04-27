export interface Customer {
    id: number;
    code: string;
    name: string;
    type: "individual" | "company";
    phone: string;
    total_jobs: number;
    created_at: string;
    updated_at: string;
}

export interface Job {
    id: number;
    code: string;
    customer_name: string;
    customer_type: string;
    total_contract_value: string;
    start_date: string;
    end_date: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    type: "pest_control" | "termite_control";
    contract_type: string;
    created_at: string;
    updated_at: string;
}

export interface Supplier {
    id: number;
    code: string;
    name: string;
    phone: string;
    address: string;
    total_orders: number;
    created_at: string;
    updated_at: string;
}

export interface Employee {
    id: number;
    name: string;
    code: string;
    role_name: string;
}

export interface Schedule {
    id: number;
    code: string;
    job: {
        id: number;
        code: string;
        customer: {
            id: number;
            code: string;
            name: string;
        };
    };
    date: string;
    employees: {
        id: number;
        code: string;
        name: string;
    }[];
    created_at: string;
    updated_at: string;
};

export interface CalendarEvent {
    id: number;
    title: string;
    start: Date;
    end: Date;
    resource: Schedule;
}

export interface Order {
    id: number;
    code: string;
    supplier: {
        id: number;
        code: string;
        name: string;
        address: string;
        phone: string;
        created_at: string;
        updated_at: string;
    };
    items: {
        id: number;
        code: string;
        name: string;
        amount: number;
        price: number;
        unit: string;
    }[];
    total_amount: number;
    total_price: number;
    created_at: string;
    updated_at: string;
}

export interface InventoryRequest {
    id: number;
    code: string;
    created_at: string; // ISO 8601
    employee: {
        id: number;
        code: string;
        name: string;
    };
    status: "requested" | "approved" | "rejected";
    type: "in" | "out";
    note: string | null;
    items: Array<{
        id: number;
        name: string;
        code: string;
        amount: number;
        unit: string;
    }>;
}

export interface TechnicianItem {
    id: number;
    code: string;
    name: string;
    type: string;
    unit: string;
    image: string;
    employee_id: number;
    amount: number;
    created_at: string;
}