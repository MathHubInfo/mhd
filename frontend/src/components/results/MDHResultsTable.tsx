import React, { Component } from 'react';
import ReactTable, { Column } from 'react-table';
import { MDHBackendClient } from "../../client";
import { MDHFilter, ParsedMDHCollection } from "../../client/derived";
import { DRFPagedResponse, MDHItem } from "../../client/rest";

interface MDHResultsTableProps {
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
}

interface MDHResultsTableState {
    /** the current page being requested */
    page: number;

    /** the current page size */
    page_size: number;

    /** set to true whenever it is loading */
    loading: boolean;

    /** the columns being shown */
    columns: Column<{}>[]

    /** the stored MDH data */
    data: MDHItem<{}>[];

    /** the total number of pages, or -1 if unknown */
    total_pages: number;

    /** when true, force an update */
    force_update: boolean;

    /** time when the table was last updated */
    last_update: number;
}

/**
 * Component that displays results based on a filter input and order input. 
 * Maintains internal state for page size
 */
export default class MDHResultsTable extends Component<MDHResultsTableProps, MDHResultsTableState> {

    state: MDHResultsTableState = {
        loading: true,

        data: [],
        page: 1,
        page_size: 20,
        total_pages: -1, 

        columns: [],

        last_update: 0,
        force_update: false,
    };

    /** called whenever the table state is updated */
    handleTableStateUpdate = (tableState: any) => {
        const {page, pageSize} = tableState as {page: number, pageSize: number};

        // store the time of this update
        const time = new Date().getTime();

        // set the newly aquired state params
        this.setState({
            page: page + 1,
            page_size: (pageSize > 100) ? 100 : pageSize,
        })

        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        setTimeout(() => {
            this.setState(({ last_update: lastUpdate }: MDHResultsTableState) => {
                if (lastUpdate >= time) return null; // an update was applied

                return {loading: true};
            });
        }, this.props.results_loading_delay);
    }

    /**
     * Schedules a data update from the server
     */
    scheduleDataUpdate = async () => {
        // because we are in a non-blocking (async) situation, we may have multiple
        // updates at the same time. To keep track if a newer one has already been applied
        // we use the current time, which is strictly increasing
        const time = new Date().getTime();

        // fetch the results with appropriate errors
        let results: DRFPagedResponse<MDHItem<{}>> = {count: 0, next: null, previous: null, num_pages: -1, results: []};
        try {
            results = await this.props.client.fetchItems(this.props.collection.slug, this.props.columns, this.props.filters, this.state.page, this.state.page_size)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.error(e);
        }

        // for introducing a dummy delay of 2 seconds, uncomment the following line
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        this.setState(({ last_update: lastUpdate }: MDHResultsTableState) => {
            if (lastUpdate > time) return null; // newer update was already applied

            // pick the appropriate columns
            const columns = this.props.columns.map(c => this.props.collection.propertyRenderers[c]);

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
    private static computeDataUpdateHash({ filters, collection: { slug }, columns }: MDHResultsTableProps, { page, page_size }: MDHResultsTableState): string {
        return MDHBackendClient.hashFetchItems(slug, columns, filters, page, page_size);
    }

    private static computeResetHash({collection: {slug}, filters}: MDHResultsTableProps): string {
        return MDHBackendClient.hashFetchItems(slug, [], filters, 1, 1);
    }
    
    componentDidUpdate(prevProps: MDHResultsTableProps, prevState: MDHResultsTableState) {
        // whenever the state drastically changed (i.e. filters changed)
        // we need to reset the page number and forcibly
        if (MDHResultsTable.computeResetHash(prevProps) !== MDHResultsTable.computeResetHash(this.props)) {
            this.setState({
                loading: true,
                data: [],
                page: 1,
                total_pages: -1,
                force_update: true, // force an update
            });
            return;
        }

        // check if any parameters have changed or we forced an update
        if (this.state.force_update || MDHResultsTable.computeDataUpdateHash(prevProps, prevState) !== MDHResultsTable.computeDataUpdateHash(this.props, this.state)) {
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
        return (
            <ReactTable manual
                filterable={false}
                sortable={false}

                loading={this.state.loading}
                page={this.state.page - 1}
                pageSize={this.state.page_size}

                data={this.state.data}
                columns={this.state.columns}
                pages={this.state.total_pages}

                onFetchData={this.handleTableStateUpdate}
            />
        );
    }
}