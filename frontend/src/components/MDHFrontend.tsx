import React from 'react';
import { MDHBackendClient } from "../client";
import { ParsedMDHCollection, MDHFilter } from '../client/derived';
import MDHFooter from './MDHFooter';
import MDHResultsDisplay from './results/MDHResultsTable';
import MDHFilterEditor from './filter/MDHFilterEditor';
import MDHColumnEditor from './columns/MDHColumnEditor';
import { Container, Row, Col } from "reactstrap";


interface MDHFrontendProps {
    /** client to talk to the server */
    client: MDHBackendClient;

    /** collection that was read */
    collection: ParsedMDHCollection;
}

interface MDHFrontendState {
    /** the set of applied filters */
    filters: MDHFilter[] | null;

    /** the set of selected columns */
    columns: string[] | null;
}

/** anything under 200ms is considered 'instant' */
const LOADING_DELAY = 200;

/**
 * The frontend instantiated for a given collection
 */
export default class MDHFrontend extends React.Component<MDHFrontendProps, MDHFrontendState> {

    state: MDHFrontendState = {
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
        const { client, collection } = this.props;

        return (
            <React.Fragment>
                <MDHFilterEditor
                    client={client}
                    collection={collection}
                    onFilterApply={this.setFilters}
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
                                                results_loading_delay={LOADING_DELAY}
                                            />
                                    }
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>
                
                <MDHFooter />
            </React.Fragment>
        );
    }

}
