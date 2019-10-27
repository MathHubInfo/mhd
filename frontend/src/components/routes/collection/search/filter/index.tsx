import React from 'react';
import { Button, Row } from 'reactstrap';
import { MHDBackendClient } from "../../../../../client";
import { MHDFilter, ParsedMHDCollection } from "../../../../../client/derived";
import { MHDMainHead } from "../../../../common/MHDMain";
import CounterDisplay from '../results/CounterDisplay';
import FilterSelector from './FilterSelector';
import LaTeX from 'react-latex';

interface FilterEditorProps {
    /** the backend  */
    client: MHDBackendClient;

    /** the current collection (if any) */
    collection: ParsedMHDCollection;

    /** the filters currently set */
    filters: MHDFilter[];

    /** callback when filters are applied  */
    onFilterApply: (filters: MHDFilter[]) => void;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface FilterEditorStateProps {
    /** the currently selected filters (maybe not applied yet) */
    filters: MHDFilter[],

    /** have the current filters been applied? */
    applied: boolean;
}

/**
 * Shows an editor filters, along with a preview for the number of elements found. 
 * Notifies the parent via onFilterApply whenever the user manually applies the filters or when the page loads. 
*/
export default class FilterEditor extends React.Component<FilterEditorProps, FilterEditorStateProps> {

    state: FilterEditorStateProps = {
        filters: this.props.filters,
        applied: false,
    };

    /** stores a new list of filters in state */
    setFilters = async (filters: MHDFilter[]) => {
        this.setState({ filters: filters, applied: false })
    }

    /* Applies the filters and passes them to the parent */
    applyFilters = () => {
        this.props.onFilterApply(this.state.filters);
        this.setState({ applied: true });
    }

    componentDidMount() {
        this.applyFilters();
    }

    render() {
        const { collection, client, results_loading_delay } = this.props;
        const { applied, filters } = this.state;

        const leftHead = <>
            <p><LaTeX>{collection.description}</LaTeX></p>
            <CounterDisplay
                collection={collection}
                client={client}
                filters={filters}
                results_loading_delay={results_loading_delay}
            />
        </>;

        const buttons = <>
            <Button onClick={this.applyFilters} disabled={applied}>Display results</Button>
            { collection.url &&
                <a href={collection.url} target="_blank" rel="noopener noreferrer">
                    <Button>More Info</Button>
                </a>
                }
        </>;

        const rightHead = <Row>
            <FilterSelector
                initialFilters={this.props.filters}
                collection={this.props.collection}
                onFilterUpdate={this.setFilters} />
        </Row>;

        return <MHDMainHead title={<LaTeX>{collection.displayName}</LaTeX>} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />;
    }
}
