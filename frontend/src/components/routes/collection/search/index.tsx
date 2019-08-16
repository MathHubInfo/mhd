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
}
/**
 * Display the search interface for a single collection
 */
export default class MDHCollectionSearch extends React.Component<MDHCollectionSearchProps, MDHCollectionSearchState> {

    state: MDHCollectionSearchState = {
        filters: null,
        columns: null,
    };

    /** called when new filters are set on the search client  */
    private setFilters = (filters: MDHFilter[]) => {
        this.setState({ filters });
    }

    private setColumns = (columns: string[]) => {
        this.setState({ columns });
    }

    render() {
        const { filters, columns } = this.state;
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
                                    results_loading_delay={results_loading_delay}
                                />
                        }
                    </Container>
                </section>
            </main>
        );
    }

}
