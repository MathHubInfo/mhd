import React from 'react';
import { Button, Col, Container, Row } from 'reactstrap';
import { MDHBackendClient } from "../../client";
import { MDHFilter, ParsedMDHCollection } from "../../client/derived";
import { title } from '../../config';
import MDHFilterSelector from './MDHFilterSelector';
import MDHCounterDisplay from '../results/MDHCounterDisplay';

interface MDHFilterEditorProps {
    /** the backend  */
    client: MDHBackendClient;

    /** the current collection (if any) */
    collection: ParsedMDHCollection;

    /** callback when filters are applied  */
    onFilterApply: (filters: MDHFilter[]) => void;
}

interface MDHFilterStateProps {
    /** the currently selected filters (maybe not applied yet) */
    filters: MDHFilter[],

    /** have the current filters been applied? */
    applied: boolean;
}

/**
 * Shows an editor filters, along with a preview for the number of elements found. 
 * Notifies the parent via onFilterApply whenever the user manually applies the filters. 
*/
export default class MDHFilterEditor extends React.Component<MDHFilterEditorProps, MDHFilterStateProps> {

    state: MDHFilterStateProps = {
        filters: [],
        applied: false,
    };

    /** stores a new list of filters in state */
    setFilters = async (filters: MDHFilter[]) => {
        this.setState({ filters, applied: false })
    }

    /* Applies the filters and passes them to the parent */
    applyFilters = () => {
        this.props.onFilterApply(this.state.filters);
        this.setState({ applied: true });
    }

    render() {
        const { collection, client } = this.props;
        const { applied } = this.state;

        return (
            <section className="bg-primary" id="search">
                <Container id="zoo-search-box">
                    <Row>
                        <Col lg="3" md="3" sm="12" className="mx-auto my-4" id="select-type">
                            <h2 className="section-heading text-white" id="step2">{title}</h2>                 
                            <p>{collection.displayName}</p>
                            <MDHCounterDisplay collection={collection} client={client} filters={this.state.filters} />
                            <div className="buttons">
                                <Button onClick={this.applyFilters} disabled={applied}>Display results</Button>
                            </div>
                        </Col>
                        <MDHFilterSelector
                            collection={this.props.collection}
                            onFilterUpdate={this.setFilters} />
                    </Row>
                </Container>
            </section>
        );
    }
}
