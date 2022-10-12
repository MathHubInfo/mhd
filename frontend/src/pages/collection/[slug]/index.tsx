import type { GetServerSideProps } from "next"
import type { NextRouter } from "next/router"
import { withRouter } from "next/router"
import React from "react"
import { Container } from "reactstrap"
import type { TCollectionPredicate } from "../../../client"
import { MHDBackendClient, ResponseError } from "../../../client"
import type { ParsedMHDCollection } from "../../../client/derived"
import type { TMHDCollection } from "../../../client/rest"
import type { PageState } from "../../../state"
import { decodeState, encodeState } from "../../../state"
import { CollectionIndex } from "../../../controller"
import CollectionTitle, { CollectionFlags } from "../../../components/query/head/title"
import CollectionInfo from "../../../components/query/head/info"
import { MHDMainHead } from "../../../components/common/MHDMain"
import ResultsTable from "../../../components/query/results"
import QueryEditor from "../../../components/query/editor"
import Exporters from "../../../components/query/results/Exporter"
import type { TableState } from "../../../components/query/results/table"

interface MHDCollectionSearchProps {
    router: NextRouter;

    /** collection that was read */
    collection: TMHDCollection;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MHDCollectionSearchState extends PageState {
    collection: ParsedMHDCollection;
}

/**
 * Display the search interface for a single collection
 */
class MHDCollectionSearch extends React.Component<MHDCollectionSearchProps, MHDCollectionSearchState> {

    state: MHDCollectionSearchState = ((): MHDCollectionSearchState => {
        // find the collection
        const collection = MHDBackendClient.getInstance().parseCollection(this.props.collection)

        // HACK: Decode the search state manually cause new URL() doesn't work
        let search = this.props.router.asPath
        if (search.indexOf("?") != -1) {
            search = search.split("?")[1]
        } else {
            search = ""
        }

        const state = decodeState(search) ?? {
            query: {
                filters: [],
                pre_filter: collection.defaultPreFilter,
            },
            columns: collection.defaultPropertySlugs.slice(),
            page: 0,
            per_page: 20,
            order: "",
        }

        // add the collection
        return { ...state, collection }
    })()

    private generateURLParams = ({ collection, ...state }: MHDCollectionSearchState): string => {
        return encodeState(state)
    }

    /** called when new filters are set in the filter editor */
    private setQuery = (query: TCollectionPredicate, columns: Array<string>, order: string) => {
        this.setState({ query, columns, order })
    }

    /** called when new columns are set in the column editor */
    private setColumns = (columns: string[], order: string) => {
        this.setState({ columns, order })
    }

    /** called when the results state is updated */
    private setResultsState = ({ page, per_page }: TableState) => {
        this.setState({ page, per_page })
    }

    componentDidUpdate(prevProps: MHDCollectionSearchProps, prevState: MHDCollectionSearchState) {
        const oldParams = this.generateURLParams(prevState)
        const newParams = this.generateURLParams(this.state)
        if (oldParams !== newParams) {
            // TODO: This should be:
            // this.props.router.replace(`?${newParams}`);
            // but NextJS doesn't like that at all
            this.props.router.replace(`${CollectionIndex(this.state.collection.slug)}?${newParams}`)
        }
    }

    render() {
        const { query, columns, page, per_page, collection, order } = this.state
        const { results_loading_delay } = this.props

        return (
            <main>
                <MHDMainHead
                    wide="fancy"

                    title={<CollectionTitle collection={collection} />}
                    textTitle={collection.displayName}
                    titleRow={<CollectionFlags collection={collection} />}

                    leftHead={<CollectionInfo collection={collection} />}
                    rightHead={
                        <QueryEditor
                            collection={collection}
                            query={query}
                            order={order}
                            columns={columns}
                            onQueryApply={this.setQuery}
                            results_loading_delay={results_loading_delay}
                        />
                    }
                />

                <section>
                    <Container>
                        {
                            (query.filters !== null) &&
                            <Exporters
                                collection={collection}
                                query={query}
                                order={order}
                            />
                        }
                        {
                            (query.filters !== null) && (columns !== null) &&
                            <ResultsTable
                                collection={collection}
                                query={query}
                                columns={columns}
                                order={order}
                                page={page}
                                per_page={per_page}
                                results_loading_delay={results_loading_delay}
                                onStateUpdate={this.setResultsState}
                            />
                        }
                    </Container>
                </section>
            </main>
        )
    }

}

export default withRouter(MHDCollectionSearch)


export const getServerSideProps: GetServerSideProps = async function ({ params: { slug } }) {
    let collection: TMHDCollection
    try {
        collection = await MHDBackendClient.getInstance().fetchCollection(slug as string)
    } catch (e) {
        if (!(e instanceof ResponseError) || !e.isNotFound) throw e
        return { notFound: true }
    }

    return {
        props: { collection, results_loading_delay: 100 }, // will be passed to the page component as props
    }
}