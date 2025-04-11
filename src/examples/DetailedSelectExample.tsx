import React, { useState } from 'react';
import { DetailedSelect, DetailedOption } from '@/components/ui/detailed-select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function DetailedSelectExample() {
    const [selectedEmployee, setSelectedEmployee] = useState<number>();
    const [selectedProject, setSelectedProject] = useState<number>();

    // Example employee data
    const employees: DetailedOption[] = [
        { id: 1, primary: 'John Doe', secondary: 'Sales Manager' },
        { id: 2, primary: 'Jane Smith', secondary: 'Salesperson' },
        { id: 3, primary: 'Robert Johnson', secondary: 'Technician' },
        { id: 4, primary: 'Emily Davis', secondary: 'Technician' }
    ];

    // Example project data
    const projects: DetailedOption[] = [
        { id: 101, primary: '#PR001', secondary: 'Acme Corporation' },
        { id: 102, primary: '#PR002', secondary: 'Globex Industries' },
        { id: 103, primary: '#PR003', secondary: 'Stark Enterprises' },
        { id: 104, primary: '#PR004', secondary: 'Wayne Industries' }
    ];

    return (
        <div className="p-6 max-w-md mx-auto space-y-6">
            <h1 className="text-2xl font-bold">DetailedSelect Examples</h1>

            <div className="space-y-2">
                <Label htmlFor="employee">Employee Selection</Label>
                <DetailedSelect
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    options={employees}
                    placeholder="Select an employee"
                />
                {selectedEmployee && (
                    <p className="text-sm text-gray-500">
                        Selected employee ID: {selectedEmployee}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="project">Project Selection</Label>
                <DetailedSelect
                    value={selectedProject}
                    onChange={setSelectedProject}
                    options={projects}
                    placeholder="Select a project"
                />
                {selectedProject && (
                    <p className="text-sm text-gray-500">
                        Selected project ID: {selectedProject}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="disabled">Disabled Example</Label>
                <DetailedSelect
                    value={undefined}
                    onChange={() => { }}
                    options={employees}
                    placeholder="This is disabled"
                    disabled={true}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="error">Error Example</Label>
                <DetailedSelect
                    value={undefined}
                    onChange={() => { }}
                    options={employees}
                    placeholder="With error state"
                    error="This field is required"
                />
                <p className="text-xs text-red-500">This field is required</p>
            </div>

            <Button onClick={() => {
                setSelectedEmployee(undefined);
                setSelectedProject(undefined);
            }}>
                Reset Selections
            </Button>
        </div>
    );
} 