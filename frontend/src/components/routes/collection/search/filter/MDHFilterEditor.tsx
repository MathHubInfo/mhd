import React from 'react';
import { Button, Row } from 'reactstrap';
import { MDHBackendClient } from "../../../../../client";
import { MDHFilter, ParsedMDHCollection } from "../../../../../client/derived";
import { MDHMainHead } from "../../../../common/MDHMain";
import MDHCounterDisplay from '../results/MDHCounterDisplay';
import MDHFilterSelector from './MDHFilterSelector';

interface MDHFilterEditorProps {
    /** the backend  */
    client: MDHBackendClient;

    /** the current collection (if any) */
    collection: ParsedMDHCollection;

    /** callback when filters are applied  */
    onFilterApply: (filters: MDHFilter[]) => void;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
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
        this.setState({ filters: filters, applied: false })
    }

    /* Applies the filters and passes them to the parent */
    applyFilters = () => {
        this.props.onFilterApply(this.state.filters);
        this.setState({ applied: true });
    }

    render() {
        const { collection, client, results_loading_delay } = this.props;
        const { applied, filters } = this.state;

        const leftHead = <>
            <p>{collection.displayName}</p>
            <MDHCounterDisplay
                collection={collection}
                client={client}
                filters={filters}
                results_loading_delay={results_loading_delay}
            />
        </>;

        const buttons = <Button onClick={this.applyFilters} disabled={applied}>Display results</Button>;

        const rightHead = <Row>
            <MDHFilterSelector
                collection={this.props.collection}
                onFilterUpdate={this.setFilters} />
        </Row>;

        return <MDHMainHead title={"MathDataHub"} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />;
    }
}
