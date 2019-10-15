import React, { Component } from 'react';
import { MDHBackendClient } from "../../../../../client";
import { MDHFilter, ParsedMDHCollection } from "../../../../../client/derived";
import { TDRFPagedResponse, TMDHItem } from "../../../../../client/rest";
import { Row, Col, Spinner } from "reactstrap";
import { Link } from "react-router-dom";
import Table, { TableColumn, TableState } from "../../../../wrappers/table";

interface ResultsTableProps extends TableState {
    /** backend client */
    client: MDHBackendClient;

    /** the current collection */
    collection: ParsedMDHCollection;

    /** the current filters */
    filters: MDHFilter[];

    /** the selected columns */
    columns: string[];

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;

    /** called whenever the state is updated in this component */
    onStateUpdate: (state: TableState) => void;
}

interface ResultsTableState {
    /** set to true whenever it is loading */
    loading: boolean;

    /** the columns being shown */
    columns: TableColumn<TMDHItem<any>>[]

    /** the stored MDH data */
    data: TMDHItem<any>[];

    /** the total number of pages, or -1 if unknown */
    total_pages: number;

    /** when true, force an update */
    force_update: boolean;

    /** time when the table was last updated */
    last_update: number;
}

/**
 * Component that displays results based on a filter input and order input. 
 * Notifies the parent whenever the page state is upated. 
 */
export default class ResultsTable extends Component<ResultsTableProps, ResultsTableState> {

    state: ResultsTableState = {
        loading: true,

        data: [],
        total_pages: -1, 

        columns: [],

        last_update: 0,
        force_update: false,
    };

    /** called whenever the table state is updated */
    handleTableStateUpdate = ({page, per_page, widths}: TableState) => {
        //notify the parent of the new state
        this.props.onStateUpdate({ page, per_page, widths });
    }

    /**
     * Schedules a data update from the server
     */
    scheduleDataUpdate = async () => {
        // because we are in a non-blocking (async) situation, we may have multiple
        // updates at the same time. To keep track if a newer one has already been applied
        // we use the current time, which is strictly increasing
        const time = new Date().getTime();

        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        setTimeout(() => {
            this.setState(({ last_update }: ResultsTableState) => {
                if (last_update >= time) return null; // an update was applied

                return {loading: true};
            });
        }, this.props.results_loading_delay);

        const { collection, columns, filters, page, per_page } = this.props;

        // fetch the results with appropriate errors
        let results: TDRFPagedResponse<TMDHItem<{}>> = {count: 0, next: null, previous: null, num_pages: -1, results: []};
        try {
            results = await this.props.client.fetchItems(collection, columns, filters, page + 1, per_page)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.error(e);
        }

        // for introducing a dummy delay of 2 seconds, uncomment the following line
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        this.setState(({ last_update }: ResultsTableState) => {
            if (last_update > time) return null; // newer update was already applied

            // pick the appropriate columns
            const columns = this.props.columns.map(c => this.props.collection.columnMap.get(c)!);
            columns.unshift({
                Cell: ({data}: TMDHItem<any>) => <ItemLink collection={this.props.collection} uuid={data._id}/>,
                Header: () => "",
                width: 50,
            })

            return {
                last_update: time,
                loading: false,
                data: results.results,
                total_pages: results.num_pages,
                columns,
            }
        });
    }

    /** computes a hash of the properties that influence data fetching */
    private static computeDataUpdateHash({ filters, collection, columns, page, per_page }: ResultsTableProps): string {
        return MDHBackendClient.hashFetchItems(collection, columns, filters, page, per_page);
    }

    private static computeResetHash({collection, filters}: ResultsTableProps): string {
        return MDHBackendClient.hashFetchItems(collection, [], filters, 1, 1);
    }
    
    componentDidUpdate(prevProps: ResultsTableProps, prevState: ResultsTableState) {
        // whenever the state drastically changed (i.e. filters changed)
        // we need to reset the page number and forcibly
        if (ResultsTable.computeResetHash(prevProps) !== ResultsTable.computeResetHash(this.props)) {
            this.setState({
                loading: true,
                data: [],
                total_pages: -1,
                force_update: true, // force an update
            });
            return;
        }

        // check if any parameters have changed or we forced an update
        if (this.state.force_update || ResultsTable.computeDataUpdateHash(prevProps) !== ResultsTable.computeDataUpdateHash(this.props)) {
            // when an update was forced, reset force_update to false
            if (this.state.force_update) {
                this.setState({force_update: false});
            }
            this.scheduleDataUpdate();
        }
    }

    componentDidMount() {
        this.scheduleDataUpdate();
    }

    render() {
        const { total_pages, columns, data, loading } = this.state;

        return (
            <Row>
                <Col>
                    {!loading && <Table
                        total_pages={total_pages}
                        per_page_selection={[10, 25, 50, 100]}
                        columns={columns}
                        data={data}
                        onStateChange={this.handleTableStateUpdate}
                        
                        page={this.props.page}
                        per_page={this.props.per_page}
                        widths={this.props.widths}
                    />}
                    {loading && <Spinner color="primary" />}
                </Col>
            </Row>
        );
    }
}

class ItemLink extends React.Component<{collection: ParsedMDHCollection, uuid: string}>{
    render() {
        const { collection, uuid } = this.props;
        return (
            <Link to={`/item/${collection.slug}/${uuid}`} target="_blank">
                <i className="fa fa-info-circle" data-fa-transform="shrink-4 up-3"></i>
            </Link>
        )
    }
}
