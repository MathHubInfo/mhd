declare module "column-resizer" {
    interface ColumnResizerOptions {
        resizeMode: "fit" | "flex" | "overflow";
        draggingClass: string;
        gripInnerHtml: string;
        liveDrag: boolean;
        minWidth: number;
        headerOnly: boolean;
        hoverCursor: "col-resize";
        dragCursor: "col-resize";
        flush: boolean;
        marginLeft: string | null;
        marginRight: string | null;
        remoteTable: string | null;
        disable: boolean;
        partialRefresh: boolean;
        disabledColumns: number[];
        removePadding: boolean;
        widths: number[];
        serialize: boolean;
    
        onDrag: (() => void) | null;
        onResize: (() => void) | null;
    }
    export default class ColumnResizer {
        constructor(tb: HTMLTableElement, options: Partial<ColumnResizerOptions>)
        tb: HTMLTableElement & {columns: HTMLTableHeaderCellElement[]}
        reset(options: Partial<ColumnResizerOptions>): ColumnResizerOptions
        createStyle(element: HTMLElement, css: string): void
    } 
}