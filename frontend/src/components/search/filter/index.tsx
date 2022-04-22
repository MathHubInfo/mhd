import React from "react"
import { Button, Row, Alert } from "reactstrap"
import type { MHDFilter, ParsedMHDCollection } from "../../../client/derived"
import { MHDMainHead } from "../../common/MHDMain"
import CounterDisplay from "../results/CounterDisplay"
import FilterSelector from "./FilterSelector"
import LaTeX from "react-latex"
import type { TMHDPreFilter, TMHDCollection } from "../../../client/rest"
import Link from "next/link"

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCommentDots } from "@fortawesome/free-regular-svg-icons"
import { CollectionProvenance, isProduction } from "../../../controller"
interface FilterEditorProps {

    /** the current collection (if any) */
    collection: ParsedMHDCollection;

    /** the filters currently set */
    filters: MHDFilter[];

    /** the user-selected pre-filter (if any) */
    pre_filter?: TMHDPreFilter

    /** callback when filters are applied  */
    onFilterApply: (filters: MHDFilter[], pre_filter?: TMHDPreFilter) => void;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface FilterEditorStateProps {
    /** the currently selected filters (maybe not applied yet) */
    filters: MHDFilter[],

    /** pre_filter selected by the user  */
    pre_filter?: TMHDPreFilter,

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
        pre_filter: this.props.pre_filter,
        applied: false,
    }

    /** stores a new list of filters in state */
    setFilters = async (filters: MHDFilter[]) => {
        this.setState({ filters: filters, applied: false })
    }

    /* Applies the filters and passes them to the parent */
    applyFilters = () => {
        this.props.onFilterApply(this.state.filters, this.state.pre_filter)
        this.setState({ applied: true })
    }

    componentDidMount() {
        this.applyFilters()
    }

    render() {
        const { collection, results_loading_delay } = this.props
        const { applied, filters, pre_filter } = this.state

        const leftHead = <>
            <p><LaTeX>{collection.description}</LaTeX></p>
            {pre_filter ?
                <PreFilterCountDisplay filter={pre_filter} collection={collection} /> :
                <TotalCountDisplay collection={collection} />
             }
            <p>
                <CounterDisplay
                    collection={collection}
                    pre_filter={pre_filter}
                    filters={filters}
                    results_loading_delay={results_loading_delay}
                />
            </p>
        </>

        const buttons = <>
                { collection.metadata &&
                <p>
                    <Link href={CollectionProvenance(collection.slug)} passHref>
                        <a target="_blank" rel="noopener noreferrer">
                            <FontAwesomeIcon transform="shrink-2" icon={faCommentDots} />&nbsp;
                            More about this dataset
                        </a>
                    </Link>
                </p>
                }
            <Button onClick={this.applyFilters} disabled={applied}>Display results</Button>
        </>

        const rightHead = <Row>
            <FilterSelector
                initialFilters={this.props.filters}
                collection={this.props.collection}
                onFilterUpdate={this.setFilters} />
        </Row>

        return <MHDMainHead title={<LaTeX>{collection.displayName}</LaTeX>} textTitle={collection.displayName} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />
    }
}

function PreFilterCountDisplay({ filter: { description, count }, collection }: {filter: TMHDPreFilter, collection: TMHDCollection}) {
    return <Alert color="info">
        <b>Pre-Filter active: </b>
        <LaTeX>{description}</LaTeX> {
            (count !== null && collection.count !== null) &&
            <>({count} / {collection.count})</>
        }
    </Alert>
}

function TotalCountDisplay({ collection: { count } }: {collection: TMHDCollection}) {
    if (count === null) {
        if (!isProduction) {
            return <Alert color="warning">No collection count available. Run <code style={{ fontSize: ".75rem" }}>python manage.py update_count</code> to update it.</Alert>
        }
        return null
    }
    return <Alert color="info">
        This dataset has {count} objects.
    </Alert>
}