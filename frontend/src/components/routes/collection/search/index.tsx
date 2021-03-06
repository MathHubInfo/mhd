import React from 'react';
import { Container, Alert } from "reactstrap";
import { MHDBackendClient } from "../../../../client";
import { MHDFilter, ParsedMHDCollection } from '../../../../client/derived';
import ColumnEditor from './columns/ColumnEditor';
import FilterEditor from './filter';
import ResultsTable from './results/ResultsTable';
import { encodeState, decodeState, MHDCollectionSearchState } from '../../../../state';
import { withRouter, RouteComponentProps } from "react-router";
import { TableState } from "../../../wrappers/table";
import { TMHDPreFilter } from "../../../../client/rest";

interface MHDCollectionSearchProps extends RouteComponentProps<{}>{
    /** client to talk to the server */
    client: MHDBackendClient;

    /** collection that was read */
    collection: ParsedMHDCollection;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

/**
 * Display the search interface for a single collection
 */
class MHDCollectionSearch extends React.Component<MHDCollectionSearchProps, MHDCollectionSearchState> {

    state: MHDCollectionSearchState = ((): MHDCollectionSearchState => {
        const s = decodeState(this.props.location.search.substring(1));
        if(s !== undefined) return s as MHDCollectionSearchState;

        // replace invalid search state to ""
        this.props.history.replace({search: ''});

        // restore the default state
        return {
            filters: [],
            pre_filter: this.props.collection.defaultPreFilter,
            columns: this.props.collection.propertySlugs.slice(),
            page: 0,
            per_page: 20,
            widths: undefined,
        };
    })();

    private generateURLParams = (state: MHDCollectionSearchState): string => {
        return encodeState(state);
    }

    /** called when new filters are set in the filter editor */
    private setFilters = (filters: MHDFilter[], pre_filter?: TMHDPreFilter) => {
        this.setState({ filters, pre_filter });
    }

    /** called when new columns are set in the column editor */
    private setColumns = (columns: string[]) => {
        this.setState({ columns });
    }

    /** called when the results state is updated */
    private setResultsState = ({ page, per_page, widths}: TableState) => {
        this.setState({ page, per_page, widths });
    }

    componentDidUpdate(prevProps: MHDCollectionSearchProps, prevState: MHDCollectionSearchState) {
        const oldParams = this.generateURLParams(prevState);
        const newParams = this.generateURLParams(this.state);
        if (oldParams !== newParams) {
            this.props.history.replace({search: `?${newParams}`});
        }
    }

    render() {
        const { filters, pre_filter, columns, page, per_page, widths } = this.state;
        const { client, collection, results_loading_delay } = this.props;

        return (
            <main>
                {collection.flag_large_collection && <Alert color="warning">This collection is very large and queries might be slow. </Alert>}
                <FilterEditor
                    client={client}
                    collection={collection}
                    filters={filters}
                    pre_filter={pre_filter}
                    onFilterApply={this.setFilters}
                    results_loading_delay={results_loading_delay}
                />
                <section>
                    <Container>
                        {
                            (filters !== null) && 
                            <ColumnEditor
                                collection={collection}
                                columns={columns}
                                onColumnsApply={this.setColumns}
                            />
                        }
                        {
                            (filters !== null) && (columns !== null) &&
                                <ResultsTable
                                    client={client}
                                    collection={collection}
                                    filters={filters}
                                    pre_filter={pre_filter}
                                    columns={columns}
                                    page={page}
                                    per_page={per_page}
                                    widths={widths}
                                    results_loading_delay={results_loading_delay}
                                    onStateUpdate={this.setResultsState}
                                />
                        }
                    </Container>
                </section>
            </main>
        );
    }

}

export default withRouter(MHDCollectionSearch);