import type { ChangeEvent } from "react"
import React from "react"

import { Button, InputGroup, InputGroupAddon, Input } from "reactstrap"

import { Table,
    Header,
    HeaderRow,
    HeaderCell,
    Body, Row, Cell } from "@table-library/react-table-library/table"
import { useTheme } from "@table-library/react-table-library/theme"
import { getTheme } from "@table-library/react-table-library/baseline"

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
    widths: string[] | undefined; // columns widths

    // optional css styling
    // TODO: Can we remove this?
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
    widths: string[] | undefined;
}

interface TableNode<D> {
    id: string;
    datum: D
}

export default function MyTable<D>({ data: items, columns, onStateChange, page, total_pages, per_page, per_page_selection, widths }: TableProps<D>) {
    const theme = useTheme(getTheme())

    const nodes = items.map((datum, index) => ({ id: index.toString(), datum: datum }))
    const data = { nodes }

    const resize = { resizerHighlight: "yellow" }

    const state: TableState = {
        per_page: per_page,
        page: page,
        widths: widths,
    }

    const layout = {
        onLayoutChange: (new_widths: string[]) => {
            if (JSON.stringify(widths) === JSON.stringify(new_widths)) return

            onStateChange({ ...state, widths: new_widths })
        },
        resizedLayout: widths,
    }

    return <>
        <Table data={data} theme={theme} layout={layout}>{(tableList) => (
            <>
                <Header>
                    <HeaderRow>{
                        columns.map((column, index) =>
                            <HeaderCell key={column.key ?? index} resize={resize}>{
                                React.createElement(column.Header, { column: column })
                            }</HeaderCell>
                        )
                    }</HeaderRow>
                </Header>
                <Body>{
                    (tableList as Array<TableNode<D>>).map(
                        item => (
                            <Row key={item.id} item={item}>{
                                columns.map((column, index) =>
                                    <Cell key={column.key ?? index} className={column.tableBodyRowCellClassName}>{
                                        React.createElement(column.Cell, { column: column, data: item.datum })
                                    }</Cell>
                                )
                            }</Row>
                        )
                    )
                }</Body>
            </>
        )}</Table>
        <div>
            <TableTablePerPageSelector
                per_page={per_page} per_page_selection={per_page_selection}
                onChange={(newPerPage: number) => {
                    const oldFirstIndex = state.per_page * state.page
                    onStateChange({
                        ...state,
                        page: Math.floor(oldFirstIndex / newPerPage),
                        per_page: newPerPage,
                    })
                }}
            />
            <TablePageSelector
                page={page} total_pages={total_pages}
                onChange={(newPage: number) => onStateChange({ ...state, page: newPage })}
            />
        </div>
    </>
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
        return <div style={{ textAlign: "center" }}>
            <Input type="select" onChange={this.handlePerPageChange as any} value={"" + per_page}>
                {per_page_selection.map(pp => {
                    return <option key={pp} value={"" + pp}>{pp}</option>
                })}
            </Input>
        </div>
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
            <InputGroupAddon addonType="prepend">
                {has_prev_page ?
                    <Button onClick={this.navigatePrevPage}>&lt;&lt;</Button> :
                    <Button disabled>&lt;&lt;</Button>
                }
            </InputGroupAddon>
            <Input disabled style={{ textAlign: "center" }} value={`${page + 1} / ${total_pages}`} />
            <InputGroupAddon addonType="prepend">
                {has_next_page ?
                    <Button onClick={this.navigateNextPage}>&gt;&gt;</Button> :
                    <Button disabled>&gt;&gt;</Button>
                }
            </InputGroupAddon>
        </InputGroup>
    }
}