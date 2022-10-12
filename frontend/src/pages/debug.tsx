import type { GetStaticProps } from "next"
import React from "react"
import type { CellComponentProps, TableColumn, TableState } from "../components/query/results/table"
import Table from "../components/query/results/table"
import { isProduction } from "../controller"

// TODO: Consider making this page debug only

class Header extends React.Component<{ column: TableColumn<any> }> {
    render() {
        return this.props.column.key
    }
}

class Cell extends React.Component<{ data: any }> {
    render() {
        return JSON.stringify(this.props.data)
    }
}

type DebugTableState = {
    table: TableState,
    columns: TableColumn<any>[]
}

export default class DebugComponent extends React.Component<{}, DebugTableState> {
    // initialize some sane table state
    state: DebugTableState = {
        table: {
            page: 0,
            per_page: 10,
        },
        columns: DebugComponent.columns.slice(0),
    }

    private onTableStateChange = (newState: TableState) => {
        this.setState({ table: newState })
    }

    private static columns: TableColumn<any>[] = [
        {
            key: "x",
            Header,
            Cell: ({ data }: CellComponentProps<any>) => <Cell data={data[0]} />,
        },
        {
            key: "2x",
            Header,
            Cell: ({ data }: CellComponentProps<any>) => <Cell data={data[1]} />,
        },
        {
            key: "3x",
            Header,
            Cell: ({ data }: CellComponentProps<any>) => <Cell data={data[2]} />,
        },
    ]

    private static MAX_DATA = 256
    private static generateData(page: number, page_size: number): number[][] {
        // generate page_size number of xs and offset them appropriatly
        const xs = Array.from(Array(page_size).keys()).map(x => x + page * page_size).filter(x => x < this.MAX_DATA)
        return xs.map(x => [x, 2 * x, 3 * x])
    }


    private shuffleColumns = () => {
        const { columns: columnsO } = this.state
        const columns = columnsO.slice(0)

        let currentIndex = columns.length
        let temporaryValue: TableColumn<any>, randomIndex: number

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex)
            currentIndex -= 1

            // And swap it with the current element.
            temporaryValue = columns[currentIndex]
            columns[currentIndex] = columns[randomIndex]
            columns[randomIndex] = temporaryValue
        }

        this.setState({ columns })
    }

    render() {
        const { table, columns } = this.state
        const data = DebugComponent.generateData(table.page, table.per_page)
        const total_pages = Math.ceil(DebugComponent.MAX_DATA / table.per_page)

        return <>
            <Table
                total_pages={total_pages}
                per_page_selection={[10, 25, 50, 100]}
                columns={columns}
                data={data}
                onStateChange={this.onTableStateChange}
                {...table}
            />
            <button onClick={this.shuffleColumns}>Shuffle Columns</button>
        </>
    }
}

export const getStaticProps: GetStaticProps = async function (context) {
    if (isProduction) return { notFound: true }
    return { props: {} }
}