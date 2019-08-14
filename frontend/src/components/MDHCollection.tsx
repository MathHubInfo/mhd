import React from 'react';
import { MDHBackendClient } from "../client";
import { ParsedMDHCollection, MDHFilter } from '../client/derived';
import MDHResultsDisplay from './results/MDHResultsTable';
import MDHFilterEditor from './filter/MDHFilterEditor';
import MDHColumnEditor from './columns/MDHColumnEditor';
import { Container, Row, Col } from "reactstrap";


interface MDHCollectionProps {
    /** client to talk to the server */
    client: MDHBackendClient;

    /** collection that was read */
    collection: ParsedMDHCollection;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MDHCollectionState {
    /** the set of applied filters */
    filters: MDHFilter[] | null;

    /** the set of selected columns */
    columns: string[] | null;
}
/**
 * Display the search interface for a single collection
 */
export default class MDHCollection extends React.Component<MDHCollectionProps, MDHCollectionState> {

    state: MDHCollectionState = {
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
            <React.Fragment>
                <MDHFilterEditor
                    client={client}
                    collection={collection}
                    onFilterApply={this.setFilters}
                    results_loading_delay={results_loading_delay}
                />
                <section id="results">
                    <Container>
                        <Row>
                            <Col lg="12">
                                <div>
                                    {
                                        (filters !== null) && 
                                        <MDHColumnEditor
                                            collection={collection}
                                            onColumnsApply={this.setColumns}
                                        />
                                    }
                                </div>
                                <div className="table-responsive">
                                    {
                                        (filters !== null) && (columns !== null) &&
                                            <MDHResultsDisplay
                                                client={client}
                                                collection={collection}
                                                filters={filters}
                                                columns={columns}
                                                results_loading_delay={results_loading_delay}
                                            />
                                    }
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
            </React.Fragment>
        );
    }

}
