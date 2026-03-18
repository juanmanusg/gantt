declare module 'frappe-gantt' {
  export interface Task {
    id: string;
    name: string;
    start: string | Date;
    end: string | Date;
    progress: number;
    dependencies?: string;
    custom_class?: string;
  }

  export interface GanttOptions {
    on_click?: (task: Task) => void;
    on_date_change?: (task: Task, start: Date, end: Date) => void;
    on_progress_change?: (task: Task, progress: number) => void;
    on_view_change?: (mode: string) => void;
    header_height?: number;
    column_width?: number;
    step?: number;
    view_modes?: string[];
    bar_height?: number;
    bar_corner_radius?: number;
    arrow_curve?: number;
    padding?: number;
    view_mode?: string;
    date_format?: string;
    custom_popup_html?: string | null;
    language?: string;
  }

  export default class Gantt {
    constructor(wrapper: string | HTMLElement, tasks: Task[], options?: GanttOptions);
    refresh(tasks: Task[]): void;
    change_view_mode(mode: string): void;
    update_options(options: GanttOptions): void;
  }
}
