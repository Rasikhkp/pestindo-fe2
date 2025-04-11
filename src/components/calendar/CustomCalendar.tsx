import React from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';

/**
 * Props for the CustomToolbar component
 */
interface CustomToolbarProps {
    date: Date;
    onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE') => void;
    label: string;
}

/**
 * Custom toolbar for the calendar to match the application design
 */
export const CustomToolbar: React.FC<CustomToolbarProps> = ({ date, onNavigate, label }) => {
    return (
        <div className="flex justify-between items-center mb-4 py-2 px-4">
            <h2 className="text-lg font-medium dark:text-gray-200">{label}</h2>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('PREV')}
                    className="dark:text-gray-200 dark:border-gray-600"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('NEXT')}
                    className="dark:text-gray-200 dark:border-gray-600"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

/**
 * Props for the EventComponent
 */
interface EventComponentProps {
    event: {
        title: string;
        [key: string]: any;
    };
}

/**
 * Custom event renderer for the calendar
 */
export const EventComponent: React.FC<EventComponentProps> = ({ event }) => {
    return (
        <div className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs overflow-hidden">
            {event.title}
        </div>
    );
};

/**
 * Props for the CustomCalendar component
 */
interface CustomCalendarProps {
    events: CalendarEvent[];
    onSelectEvent: (event: CalendarEvent) => void;
    onSelectSlot: (slotInfo: { start: Date }) => void;
}

/**
 * Setup for date-fns localization with Indonesian locale
 */
const getLocalizer = () => {
    const locales = {
        'id': {
            week: {
                dow: 1, // Monday is the first day of the week
                doy: 1, // First week of the year contains Jan 1st
            },
            months: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
            monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'],
            weekdays: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
            weekdaysShort: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
        }
    };

    return dateFnsLocalizer({
        format,
        parse,
        startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
        getDay,
        locales,
    });
};

/**
 * A customized calendar component wrapping react-big-calendar with custom styles and behavior
 */
export const CustomCalendar: React.FC<CustomCalendarProps> = ({ events, onSelectEvent, onSelectSlot }) => {
    const localizer = getLocalizer();

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 dark:bg-[#30334E] dark:border-gray-600 calendar-container">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                views={[Views.MONTH]}
                defaultView={Views.MONTH}
                style={{ height: 600 }}
                components={{
                    toolbar: CustomToolbar,
                    event: EventComponent,
                }}
                onSelectEvent={onSelectEvent}
                onSelectSlot={(slotInfo: { start: Date }) => onSelectSlot(slotInfo)}
                selectable
                popup
                className="dark:text-gray-200 custom-calendar"
            />
        </div>
    );
}; 