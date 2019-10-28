import React from 'react';
import { ParsedMHDCollection } from "../../../client/derived";
import { MHDBackendClient, ResponseError } from "../../../client";
import MHDMain, { MHDLoading } from "../../common/MHDMain";

interface MHDCollectionProps {
    /** client being used by the backend */
    client: MHDBackendClient;

    results_loading_delay: number;

    /** name of the collection to render */
    collection: string;
}

interface MHDCollectionState {
    /** are we loading */
    loading?: boolean;

    /** when set, render this collection */
    collection?: ParsedMHDCollection;

    /** when set, render an error page */
    failed?: any;

    /** when set, render a not found page with the given collection name */
    not_found?: boolean;

}

type ReactComponent<T> = React.ComponentClass<T> | React.SFC<T>;
type CollectionComponent = ReactComponent<{
    client: MHDBackendClient;
    results_loading_delay: number;
    collection: ParsedMHDCollection;
}>

/**
 * Loads collection data and either loads the Search page or the not found page
 */
export default class MHDCollectionFactory extends React.Component<MHDCollectionProps & {component: CollectionComponent}, MHDCollectionState> {
    state: MHDCollectionState = {
        loading: true,
    }

    async componentDidMount() {
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {results_loading_delay} ms. 
        setTimeout(() => {
            this.setState(({ loading }: MHDCollectionState) => {
                if (loading !== undefined) return null; // an update was applied
                return { loading: true };
            });
        }, this.props.results_loading_delay);


        // update the collection using the api client
        try {
            const collection = await this.props.client.fetchCollection(this.props.collection);
            this.setState({
                loading: false,
                collection
            })
        } catch (e) {
            if (e instanceof ResponseError && e.isNotFound) {
                this.setState({
                    loading: false,
                    not_found: true,
                })
            } else {
                this.setState({
                    loading: false,
                    failed: e,
                });
            }
        }
    }

    render() {
        const { loading, collection, not_found, failed } = this.state;
        const { client, results_loading_delay, component: Component } = this.props;
        
        // Render a loading indicator when loading
        if (loading) return <MHDLoading />;

        // when something went wrong, render an error
        if (failed) return <MHDMain title="Error" leftHead={`Something went wrong: ${failed}`} />;

        // when the collection wasn't found, render the 404 page
        if (not_found !== undefined) return "Not Found";

        // when we have a single collection, render it
        if (collection !== undefined) return <Component client={client} collection={collection} results_loading_delay={results_loading_delay} />

        // else render nothing
        return null;
    }
}