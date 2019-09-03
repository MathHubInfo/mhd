import React, { ChangeEvent } from 'react';
import style from './table.module.css';

import ColumnResizer, { ColumnResizerOptions } from 'column-resizer';
import { Button, InputGroup, InputGroupAddon, Input } from "reactstrap";

interface TableProps<D> extends TableState {

    // data itself
    columns: TableColumn<D>[] // the ordered set of columns
    data: D[] // array of rows

    // called whenever the state changes
    onStateChange: (state: TableState) => void;

    // page state -- only relevant for interface
    page: number; // zero-based page number
    total_pages: number; // the total number of pages, if known 
    per_page: number; // number of elements per-page
    per_page_selection: number[]; // available options of per-page
    widths: number[] | undefined; // columns widths

    // optional css styling
    tableHeadClassName?: string
    tableGripClassName?: string
    tableHeadCellClassName?: string
    tableBodyRowClassName?: string
    tableFootClassName?: string
    tableFootCellClassName?: string
    
}

export interface TableColumn<D> {
    key: React.Key; // key used to uniquely identify this header amongst the other set of columns
    Header: React.ComponentType<ColumnHeaderComponentProps<D>> // component used to render the header
    Cell: React.ComponentType<CellComponentProps<D>> // component used to render cells in this column

    // optional css styling
    tableBodyRowCellClassName?: string;
}

export interface ColumnHeaderComponentProps<D> {
    column: TableColumn<D>
}

export interface CellComponentProps<D> extends ColumnHeaderComponentProps<D> {
    data: D,
}

export interface TableState {
    per_page: number;
    page: number;
    widths: number[] | undefined;
}

/**
 * The table component is a fully-controlled React-Table Component. 
 */
export default class Table<D, H = undefined> extends React.Component<TableProps<D>> {

    private tableRef = React.createRef<HTMLTableElement>();
    private resizer: ColumnResizer | undefined;

    /**
     * Initializes or re-initalizes the resizer
     */
    private initResizer({widths}: {widths: number[] | undefined}) {
        const opts: Partial<ColumnResizerOptions> = {
            resizeMode: 'flex',
            gripInnerHtml:`<div class='${this.props.tableGripClassName || style.grip}'></div>`,
            widths,
            serialize: false,
            onResize: this.handleResizeChange,
        };
        
        // if we already have a resizer, we need to disable it first
        if (this.resizer) this.resizer.reset({disable: true});
        
        this.resizer = new ColumnResizer(this.tableRef.current!, opts);
    }

    componentDidMount() {
        const {widths} = this.props;
        this.initResizer({widths});
    }

    componentWillUnmount() {
        if (this.resizer) {
            this.resizer.reset({disable: true});
            this.resizer = undefined;
        }
    }


    /** gets the current table state from the props */
    private getTableState = (): TableState => ({
        per_page: this.props.per_page,
        page: this.props.page,
        widths: this.props.widths,
    })

    /** handles changing a page */
    private handlePageChange = (newPage: number) => {
        this.props.onStateChange({ ...this.getTableState(), page: newPage});
    }

    /** handles changing a page */
    private handlePerPageChange = (newPerPage: number) => {
        const state = this.getTableState();
        const oldFirstIndex = state.per_page * state.page;
        this.props.onStateChange({
            ...state,
            page: Math.floor(oldFirstIndex / newPerPage),
            per_page: newPerPage
        });
    }

    private handleResizeChange = () => {
        if(!this.resizer) return;

        const widths = this.resizer.tb.columns.map(x => x.getBoundingClientRect().width);

        const state = this.getTableState();
        this.props.onStateChange({
            ...state,
            widths,
        });
    }

    /** checks if two columns are identical */
    private static columnsAreEqual<D>(previous: TableColumn<D>[], current: TableColumn<D>[]) {
        if (previous.length !== current.length) return false;

        for (let i=0; i < previous.length; i++) {
            if (previous[i].key !== current[i].key) return false;
        }

        return true;
    }

    /** maps columns widths from an old state onto a new state with the new column order */
    private static mapColumnWidths<D>({columns, widths}: TableProps<D>, {columns: ncolumns}: TableProps<D>): number[] | undefined {
        if (widths === undefined) return undefined;
        
        return ncolumns.map(c => {
            const idx = columns.findIndex(d => d.key === c.key);
            if (idx === -1) return 0; // TODO: Default width
            return widths[idx];
        })
    }

    componentDidUpdate(prevProps: TableProps<D>) {
        if(!Table.columnsAreEqual(prevProps.columns, this.props.columns)) {

            // compute the adjusted columns
            const widths = Table.mapColumnWidths(prevProps, this.props);
            this.initResizer({ widths });

            // and resize
            this.handleResizeChange();
        }
    }

    render() {
        const { columns, data, 
            page, total_pages, per_page, per_page_selection,
            tableHeadClassName, tableHeadCellClassName, tableBodyRowClassName,
            tableFootClassName, tableFootCellClassName
        } = this.props;

        return (
            <table className="table table-bordered" ref={this.tableRef}>
        
            <thead>
                <tr className={tableHeadClassName}>
                    { columns.map((c: TableColumn<D>, idx: number) => {
                        const { Header, key } = c;
                        return <th className={tableHeadCellClassName} key={(key || idx)}><Header column={c} /></th>;
                    })}
                </tr>
            </thead>

            <tbody>
                { data.map((row: D, idx: number) => <tr key={idx} className={tableBodyRowClassName}>
                    {
                        columns.map((c: TableColumn<D>, idx2: number) => {
                            const { Cell, key, tableBodyRowCellClassName: columnCellClassName } = c;

                            return <td key={key || idx2} className={columnCellClassName}>
                                <Cell column={c} data={row} />
                            </td>;
                        })
                    }
                </tr>)}
            </tbody>

            <tfoot>
                <tr className={tableFootClassName}>
                    <td colSpan={columns.length} className={tableFootCellClassName}>
                        <TableTablePerPageSelector
                            per_page={per_page} per_page_selection={per_page_selection}
                            onChange={this.handlePerPageChange}
                        />
                    </td>
                </tr>
                <tr className={tableFootClassName}>
                    <td colSpan={columns.length} className={tableFootCellClassName}>
                        <TablePageSelector
                            page={page} total_pages={total_pages}
                            onChange={this.handlePageChange}
                        />
                    </td>
                </tr>
            </tfoot>
        </table>
        );
    }
}

interface TablePerPageSelectorProps extends Pick<TableProps<any>, "per_page" | "per_page_selection">{
    onChange: (newPerPage: number) => void;
}

class TableTablePerPageSelector extends React.Component<TablePerPageSelectorProps> {
    private handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = this.props.per_page_selection[event.target.selectedIndex];
        this.props.onChange(newPerPage);
    }
    render() {
        const { per_page, per_page_selection } = this.props;
        return <div style={{textAlign: 'center'}}>
            <Input type="select" onChange={this.handlePerPageChange as any} value={"" + per_page}>
                { per_page_selection.map(pp => {
                    return <option key={pp} value={"" + pp}>{pp}</option>
                })}
            </Input>
        </div>;
    }
}

interface TablePageSelectorProps extends Pick<TableProps<any>, "page" | "total_pages" >{
    onChange: (newPage: number) => void;
}

class TablePageSelector extends React.Component<TablePageSelectorProps> {
    private navigatePrevPage = () => {
        this.props.onChange(this.props.page - 1);
    }
    private navigateNextPage = () => {
        this.props.onChange(this.props.page + 1);
    }
    render() {
        const { page, total_pages } = this.props;

        const has_prev_page = page > 0;
        const has_next_page = page + 1 < total_pages;

        return <InputGroup>
            <InputGroupAddon addonType="prepend">
                { has_prev_page ?
                    <Button onClick={this.navigatePrevPage}>&lt;&lt;</Button> : 
                    <Button disabled>&lt;&lt;</Button>
                }
            </InputGroupAddon>
            <Input disabled style={{textAlign: 'center'}} value={`${page + 1} / ${total_pages}`} />
            <InputGroupAddon addonType="prepend">
                { has_next_page ? 
                    <Button onClick={this.navigateNextPage}>&gt;&gt;</Button> :
                    <Button disabled>&gt;&gt;</Button>
                }
            </InputGroupAddon>
        </InputGroup>;
    }
}