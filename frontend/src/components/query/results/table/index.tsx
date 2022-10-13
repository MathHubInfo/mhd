import React from "react"
import { Spinner } from "reactstrap"
import style from "./index.module.css"

export type TableProps<D> = {
    columns: TableColumn<D>[] // the ordered set of columns
    data: D[] // array of rows
    loading: boolean;
}

export type TableColumn<D> = {
    key: React.Key; // key used to uniquely identify this header amongst the other set of columns
    Header: React.ComponentType<ColumnHeaderComponentProps<D>> // component used to render the header
    Cell: React.ComponentType<CellComponentProps<D>> // component used to render cells in this column
}

export type ColumnHeaderComponentProps<D> = {
    column: TableColumn<D>
}

export type CellComponentProps<D> = ColumnHeaderComponentProps<D> & {
    data: D,
}

/**
 * Table implements a fully controlled Table Component
 */
export default class Table<D> extends React.Component<TableProps<D>> {
    render() {
        const { columns, data, loading } = this.props

        if (loading) {
            return <div className={style.ResultsTable}>
                <Spinner />
            </div>
        }

        return <div className={style.ResultsTable}>
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
                                const { Cell, key } = c

                                return <td key={key ?? idx2}>
                                    <Cell column={c} data={row} />
                                </td>
                            })
                        }
                    </tr>)}
                </tbody>
            </table>
        </div>
    }
}
