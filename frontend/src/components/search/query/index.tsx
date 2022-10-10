import React from "react"
import { Badge, Button, Row, Alert, Tooltip } from "reactstrap"
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
import { ShareThisPage } from "../../wrappers/share"
import type { TCollectionPredicate } from "../../../client"

interface QueryEditorProps {
    /** the current collection (if any) */
    collection: ParsedMHDCollection;

    /* the applied query */
    query: TCollectionPredicate,

    /* callback when the query is updated */
    onQueryApply: (query: TCollectionPredicate) => void;

    /** timeout after which not to */
    results_loading_delay: number;
}

interface QueryEditorState {
    /** the current query being edited */
    query: TCollectionPredicate;

    /** have the current filters been applied? */
    applied: boolean;
}

/**
 * QueryEditor shows an editor for queries.
 * This takes a collection, and shows an editor to update it.
 */
export default class QueryEditor extends React.Component<QueryEditorProps, QueryEditorState> {

    state: QueryEditorState = {
        query: this.props.query,
        applied: false,
    }

    /** stores a new list of filters in state */
    private readonly setFilters = async (filters: MHDFilter[]) => {
        const { query: { pre_filter } } = this.state
        this.setState({ query: { filters, pre_filter }, applied: false })
    }

    /* Applies the filters and passes them to the parent */
    private readonly applyFilters = () => {
        this.props.onQueryApply(this.props.query)
        this.setState({ applied: true })
    }

    componentDidMount() {
        this.applyFilters()
    }

    render() {
        const { collection, results_loading_delay } = this.props
        const { applied, query } = this.state
        const { pre_filter } = query

        const leftHead = <>
            {collection.hidden && <HiddenBadge />}
            <p><LaTeX>{collection.description}</LaTeX></p>
            {pre_filter ?
                <PreFilterCountDisplay filter={pre_filter} collection={collection} /> :
                <TotalCountDisplay collection={collection} />
            }
            <p>
                <CounterDisplay
                    collection={collection}
                    query={query}
                    results_loading_delay={results_loading_delay}
                />
            </p>
        </>

        const buttons = <>
            {collection.metadata &&
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
            &nbsp;
            <ShareThisPage />
        </>

        const rightHead = <Row>
            <FilterSelector
                initialFilters={this.props.query.filters}
                collection={this.props.collection}
                onFilterUpdate={this.setFilters} />
        </Row>

        return <MHDMainHead title={<>
            <LaTeX>{collection.displayName}</LaTeX>
        </>} textTitle={collection.displayName} leftHead={leftHead} buttons={buttons} rightHead={rightHead} />
    }
}

class HiddenBadge extends React.Component<{}, { hover: boolean }> {
    state = { hover: false }

    private readonly onToggle = () => {
        this.setState(({ hover }) => ({ hover: !hover }))
    }
    render() {
        const { hover } = this.state
        return <p>
            <Badge id="hiddenBage">Unlisted</Badge>
            <Tooltip placement="right" isOpen={hover} target="hiddenBage" toggle={this.onToggle}>
                This collection is not shown on the front page.
                Only share the link with people you trust.
            </Tooltip>
        </p>
    }
}

function PreFilterCountDisplay({ filter: { description, count }, collection }: { filter: TMHDPreFilter, collection: TMHDCollection }) {
    return <Alert color="info">
        <b>Pre-Filter active: </b>
        <LaTeX>{description}</LaTeX> {
            (count !== null && collection.count !== null) &&
            <>({count} / {collection.count})</>
        }
    </Alert>
}

function TotalCountDisplay({ collection: { count } }: { collection: TMHDCollection }) {
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