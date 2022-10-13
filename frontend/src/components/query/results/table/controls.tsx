import * as React from "react"
import { Button, Input, InputGroup } from "reactstrap";
import { TableProps } from ".";
import style from "./controls.module.css"

type ControlsProps = ControlsState & {
    // called whenever the state changes
    onStateChange: (state: ControlsState) => void;

    // page state -- only relevant for interface
    page: number; // zero-based page number
    total_pages: number; // the total number of pages, if known 
    per_page: number; // number of elements per-page
    per_page_selection: number[]; // available options of per-page
}

export type ControlsState = {
    per_page: number;
    page: number;
}

export default class Controls extends React.Component<ControlsProps> {

    /** gets the current table state from the props */
    private getTableState = (): ControlsState => ({
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
        const { page, per_page, total_pages, per_page_selection } = this.props
        return <div className={style.Controls}>
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
    }
}

type TablePerPageSelectorProps = Pick<ControlsProps, "per_page" | "per_page_selection"> & {
    onChange: (newPerPage: number) => void;
}

export class TableTablePerPageSelector extends React.Component<TablePerPageSelectorProps> {
    private handlePerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
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

type TablePageSelectorProps = Pick<ControlsProps, "page" | "total_pages"> & {
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
            <Input disabled value={`${page + 1} / ${total_pages}`} />
            {has_next_page ?
                <Button onClick={this.navigateNextPage}>&gt;&gt;</Button> :
                <Button disabled>&gt;&gt;</Button>
            }
        </InputGroup>
    }
}