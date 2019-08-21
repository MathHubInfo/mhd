import React from 'react';
import { Container } from "reactstrap";
import { MDHBackendClient } from "../../../../client";
import { MDHFilter, ParsedMDHCollection } from '../../../../client/derived';
import ColumnEditor from './columns/ColumnEditor';
import FilterEditor from './filter';
import ResultsTable from './results/ResultsTable';


interface MDHCollectionSearchProps {
    /** client to talk to the server */
    client: MDHBackendClient;

    /** collection that was read */
    collection: ParsedMDHCollection;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MDHCollectionSearchState {
    /** the set of applied filters */
    filters: MDHFilter[] | null;

    /** the set of selected columns */
    columns: string[] | null;

    /** the current result page */
    page: number;

    /** the current selected page size */
    page_size: number;
}
/**
 * Display the search interface for a single collection
 */
export default class MDHCollectionSearch extends React.Component<MDHCollectionSearchProps, MDHCollectionSearchState> {

    state: MDHCollectionSearchState = {
        filters: null,
        columns: null,
        page: 1,
        page_size: 20,
    };

    /** called when new filters are set in the filter editor */
    private setFilters = (filters: MDHFilter[]) => {
        this.setState({ filters });
    }

    /** called when new columns are set in the column editor */
    private setColumns = (columns: string[]) => {
        this.setState({ columns });
    }

    /** called when the results state is updated */
    private setResultsState = ({ page, page_size}: {page: number, page_size: number}) => {
        this.setState({ page, page_size });
    }

    render() {
        const { filters, columns, page, page_size } = this.state;
        const { client, collection, results_loading_delay } = this.props;

        return (
            <main>
                <FilterEditor
                    client={client}
                    collection={collection}
                    onFilterApply={this.setFilters}
                    results_loading_delay={results_loading_delay}
                />
                <section>
                    <Container>
                        {
                            (filters !== null) && 
                            <ColumnEditor
                                collection={collection}
                                onColumnsApply={this.setColumns}
                            />
                        }
                        {
                            (filters !== null) && (columns !== null) &&
                                <ResultsTable
                                    client={client}
                                    collection={collection}
                                    filters={filters}
                                    columns={columns}
                                    page={page}
                                    page_size={page_size}
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
