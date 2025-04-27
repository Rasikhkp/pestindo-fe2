import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import {
    Calendar,
    Users,
    Briefcase,
    User,
    PlayCircle,
    Eye,
    Share2,
    FileDown,
    ChevronRight,
} from "lucide-react";
import { cn, convertSnakeToTitleCase } from "@/lib/utils";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
// import { Input } from "@/components/ui/input";
// import { useState } from "react";
import { Task } from "@/routes/_layout.technician_.job";
import { Link } from "@tanstack/react-router";


export const JobCard = ({ task }: { task: Task }) => {
    return (
        <Card className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-card/95 p-4 shadow-lg transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 hover:from-card/95 hover:to-card sm:p-6">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-700 ease-out group-hover:scale-150" />
            <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-gradient-to-tr from-primary/5 to-primary/10 transition-all duration-700 ease-out group-hover:scale-150" />

            <div className="relative space-y-3 sm:space-y-4">
                <div className="flex flex-wrap items-center gap-2 sm:justify-between">
                    <Badge
                        variant="secondary"
                        className={cn(
                            "px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-medium tracking-wide transition-colors",
                            task.task.type === "Pest Control"
                                ? "bg-blue-100/80 text-blue-800 backdrop-blur-sm dark:bg-blue-900/80 dark:text-blue-200"
                                : "bg-yellow-100/80 text-yellow-800 backdrop-blur-sm dark:bg-yellow-900/80 dark:text-yellow-200"
                        )}
                    >
                        {convertSnakeToTitleCase(task.task.type)}
                    </Badge>
                    <Badge
                        variant="outline"
                        className="border-2 px-3 py-1 text-xs sm:px-4 sm:py-1.5 sm:text-sm font-medium tracking-wide backdrop-blur-sm"
                    >
                        {convertSnakeToTitleCase(task.task.contract_type)}
                    </Badge>
                </div>

                <div className="space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-xs sm:text-sm font-medium">
                                {new Date(task.date).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">

                            <Badge variant="secondary" className={cn(
                                "px-2 py-0.5 text-xs font-semibold sm:px-3 sm:py-1",
                                task.is_done
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                            )}>
                                {task.is_done ? "Selesai" : "Belum Selesai"}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">{task.employees.map(employee => employee.name).join(", ")}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">{task.task.customer_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-xs sm:text-sm font-medium">{task.task.code}</span>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground/80">
                        {task.task.address}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2">


                        {task.is_done ? (
                            <div className="flex items-center gap-3 sm:gap-2">
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Link
                                            to="/technician/service-report/$service_report_id"
                                            params={{ service_report_id: task.task.id.toString() }}
                                        >
                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-secondary transition-colors hover:bg-gray-200">
                                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Lihat Detail
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-secondary transition-colors hover:bg-gray-200"
                                        >
                                            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Bagikan
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 rounded-full bg-secondary transition-colors hover:bg-gray-200"
                                        >
                                            <FileDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Download PDF
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        ) : (
                            <Link to="/technician/service-report/create/$job_id" params={{ job_id: task.task.id.toString() }} className="w-full">
                                <Button
                                    className="group w-full relative overflow-hidden rounded-full bg-primary px-4 py-1.5 sm:px-6 sm:py-2 text-xs sm:text-sm font-medium text-primary-foreground transition-all duration-300 hover:bg-primary/90"
                                    onClick={() => console.log('Start task:', task.id)}
                                >
                                    <span className="relative z-10 flex items-center gap-1">
                                        <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        <span>Start</span>
                                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                    <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary/0 via-primary-foreground/5 to-primary/0 transition-transform hover:translate-x-full" />
                                </Button>
                            </Link>

                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}