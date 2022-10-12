import type { ChangeEvent } from "react"
import React from "react"
import style from "./table.module.css"

import { Button, InputGroup, Input } from "reactstrap"

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
}

/**
 * The table component is a fully-controlled React-Table Component. 
 */
export default class Table<D> extends React.Component<TableProps<D>> {

    /** gets the current table state from the props */
    private getTableState = (): TableState => ({
        per_page: this.props.per_page,
        page: this.props.page,
    })

    /** handles changing a page */
    private handlePageChange = (newPage: number) => {
        this.props.onStateChange({ ...this.getTableState(), page: newPage })
    }

    /** handles changing a page */
    private handlePerPageChange = (newPerPage: number) => {
        const state = this.getTableState()
        const oldFirstIndex = state.per_page * state.page
        this.props.onStateChange({
            ...state,
            page: Math.floor(oldFirstIndex / newPerPage),
            per_page: newPerPage,
        })
    }

    render() {
        const { columns, data,
            page, total_pages, per_page, per_page_selection,
             } = this.props

        const controlTable = <div className={style.Controls}>
            <div>
                <TableTablePerPageSelector
                    per_page={per_page} per_page_selection={per_page_selection}
                    onChange={this.handlePerPageChange}
                />
            </div>
            <div>
                <TablePageSelector
                    page={page} total_pages={total_pages}
                    onChange={this.handlePageChange}
                />
            </div>
        </div>

        return <>
            {controlTable}

            <div className={style.ResultsTable}>
                <table className="table table-bordered">

                    <thead>
                        <tr>
                            {columns.map((c: TableColumn<D>, idx: number) => {
                                const { Header, key } = c
                                return <th key={(key || idx)}><Header column={c} /></th>
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {data.map((row: D, idx: number) => <tr key={idx}>
                            {
                                columns.map((c: TableColumn<D>, idx2: number) => {
                                    const { Cell, key, tableBodyRowCellClassName: columnCellClassName } = c

                                    return <td key={key || idx2} className={columnCellClassName}>
                                        <Cell column={c} data={row} />
                                    </td>
                                })
                            }
                        </tr>)}
                    </tbody>
                </table>
            </div>
            {controlTable}
        </>
    }
}

interface TablePerPageSelectorProps extends Pick<TableProps<any>, "per_page" | "per_page_selection"> {
    onChange: (newPerPage: number) => void;
}

class TableTablePerPageSelector extends React.Component<TablePerPageSelectorProps> {
    private handlePerPageChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const newPerPage = this.props.per_page_selection[event.target.selectedIndex]
        this.props.onChange(newPerPage)
    }
    render() {
        const { per_page, per_page_selection } = this.props
        return <Input type="select" onChange={this.handlePerPageChange as any} value={"" + per_page}>
            {per_page_selection.map(pp => {
                return <option key={pp} value={"" + pp}>{pp}</option>
            })}
        </Input>
    }
}

interface TablePageSelectorProps extends Pick<TableProps<any>, "page" | "total_pages"> {
    onChange: (newPage: number) => void;
}

class TablePageSelector extends React.Component<TablePageSelectorProps> {
    private navigatePrevPage = () => {
        this.props.onChange(this.props.page - 1)
    }
    private navigateNextPage = () => {
        this.props.onChange(this.props.page + 1)
    }
    render() {
        const { page, total_pages } = this.props

        const has_prev_page = page > 0
        const has_next_page = page + 1 < total_pages

        return <InputGroup>
            {has_prev_page ?
                <Button onClick={this.navigatePrevPage}>&lt;&lt;</Button> :
                <Button disabled>&lt;&lt;</Button>
            }
            <Input disabled style={{ textAlign: "center" }} value={`${page + 1} / ${total_pages}`} />
            {has_next_page ?
                <Button onClick={this.navigateNextPage}>&gt;&gt;</Button> :
                <Button disabled>&gt;&gt;</Button>
            }
        </InputGroup>
    }
}