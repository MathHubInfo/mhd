import React from "react"
import LaTeX from "react-latex"
import { Alert, Button, ButtonGroup, Row } from "reactstrap"
import type { TCollectionPredicate } from "../../../client"
import type { MHDFilter, ParsedMHDCollection } from "../../../client/derived"
import type { TMHDCollection, TMHDPreFilter } from "../../../client/rest"
import NavTabs from "../../wrappers/navtabs"
import CounterDisplay from "../results/CounterDisplay"
import ColumnEditor from "./ColumnEditor"
import FilterSelector from "./FilterSelector"
import styles from "./index.module.css"
import OrderEditor from "./OrderEditor"

interface QueryEditorProps {
    /** the current collection (if any) */
    collection: ParsedMHDCollection;

    /* the applied query */
    query: TCollectionPredicate,

    /** the applied columns */
    columns: string[];

    /** the applied order */
    order: string;

    /* callback when the query is updated */
    onQueryApply: (query: TCollectionPredicate, columns: string[], order: string) => void;

    /** timeout after which not to */
    results_loading_delay: number;
}

interface QueryEditorState {
    /** current query + params being edited */
    query: TCollectionPredicate;
    columns: string[];
    order: string;

    /** the active tab */
    activeTab: string;

    filtersDirty: boolean;
    columnsDirty: boolean;
    orderDirty: boolean;

    /** have the current filters been applied? */
    applied: boolean;
}

/**
 * QueryEditor implements an editor for filters, columns, and order
 */
export default class QueryEditor extends React.Component<QueryEditorProps, QueryEditorState> {

    state: QueryEditorState = {
        query: this.props.query,
        columns: this.props.columns,
        order: this.props.order,

        activeTab: "filter",

        applied: false,
        filtersDirty: false,
        columnsDirty: false,
        orderDirty: false,
    }


    //
    // SET SUB-STATE
    //

    private readonly setFilters = (filters: MHDFilter[]) => {
        const { query: { pre_filter } } = this.state
        this.setState({ query: { filters, pre_filter }, filtersDirty: true, applied: false })
    }

    private readonly setColumns = (columns: string[]) => {
        this.setState({ columns, columnsDirty: true, applied: false })
    }

    private readonly setOrder = (order: string) => {
        this.setState({ order, orderDirty: true, applied: false })
    }

    //
    // APPLY
    //

    private readonly applyFilters = () => {
        const { query, columns, order } = this.state
        this.setCleanState(query, columns, order)
    }

    private readonly resetFilters = () => {
        const { query, columns, order } = this.props
        this.setCleanState(query, columns, order)
    }

    private readonly defaultFilters = () => {
        const { collection: { defaultPropertySlugs, defaultPreFilter } } = this.props

        const query = { filters: [], pre_filter: defaultPreFilter }
        const columns = defaultPropertySlugs.slice()
        const order = ""

        this.setCleanState(query, columns, order)
    }

    private readonly setCleanState = (query: TCollectionPredicate, columns: string[], order: string) => {
        this.props.onQueryApply(query, columns, order)
        this.setState({
            query,
            columns,
            order,
            filtersDirty: false, columnsDirty: false, orderDirty: false,
            applied: true,
        })
    }

    componentDidMount() {
        this.applyFilters()
    }

    render() {
        const { collection, results_loading_delay } = this.props
        const { applied, query, columns, order } = this.state
        const { pre_filter, filters } = query

        const dirtyTitle = (title: string, dirty: boolean) => dirty ? `${title} (*)` : title

        return <>
            <NavTabs className={styles.Tabs}>{[
                {
                    id: "filter",
                    title: dirtyTitle("Filters", this.state.filtersDirty),
                    children: <Row>
                        <FilterSelector
                            filters={filters}
                            collection={collection}
                            onFilterUpdate={this.setFilters}
                        />
                    </Row>,
                },
                {
                    id: "columns",
                    title: dirtyTitle("Columns", this.state.columnsDirty),
                    children: (query.filters !== null) && <Row>
                        <ColumnEditor
                            collection={collection}
                            columns={columns}
                            onColumnsUpdate={this.setColumns}
                        />
                    </Row>,
                },
                {
                    id: "sort",
                    title: dirtyTitle("Sort", this.state.orderDirty),
                    children: (query.filters !== null) && <Row>
                        <OrderEditor
                            collection={collection}
                            order={order}
                            onOrderUpdate={this.setOrder}
                        />
                    </Row>,
                },
            ]}</NavTabs>

            <div className={styles.Buttons}>

                <ButtonGroup className={styles.ButtonBar}>
                    <Button onClick={this.defaultFilters} color="warning">Defaults</Button>
                    <Button onClick={this.resetFilters} disabled={applied} color="info">Reset</Button>
                    <Button onClick={this.applyFilters} disabled={applied}>Apply & Display Results</Button>
                </ButtonGroup>

                {pre_filter && <PreFilterCountDisplay filter={pre_filter} collection={collection} />}
                <CounterDisplay
                    collection={collection}
                    query={query}
                    results_loading_delay={results_loading_delay}
                />
            </div>
        </>
    }
}


function PreFilterCountDisplay({ filter: { description, count }, collection }: { filter: TMHDPreFilter, collection: TMHDCollection }) {
    return <Alert color="info">
        <b>Pre-Filter active: </b>
        <LaTeX>{description}</LaTeX> {
            (count !== null && collection.count !== null) &&
            <>({count} / {collection.count})</>
        }
    </Alert>
}
