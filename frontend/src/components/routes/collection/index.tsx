import React from 'react';
import { ParsedMDHCollection } from "../../../client/derived";
import { MDHBackendClient, ResponseError } from "../../../client";
import MDHCollectionNotFound from "./notfound";
import MDHCollectionSearch from "../search/MDHCollectionSearch";

interface MDHCollectionProps {
    /** client being used by the backend */
    client: MDHBackendClient;

    /** name of the collection to render */
    collection: string;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MDHCollectionState {
    /** are we loading */
    loading?: boolean;

    /** when set, render this collection */
    collection?: ParsedMDHCollection;

    /** when set, render an error page */
    failed?: any;

    /** when set, render a not found page with the given collection name */
    not_found?: boolean;

}

/**
 * Loads collection data and either loads the Search page or the not found page
 */
export default class MDHCollection extends React.Component<MDHCollectionProps, MDHCollectionState> {
    state: MDHCollectionState = {}

    async componentDidMount() {
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {results_loading_delay} ms. 
        setTimeout(() => {
            this.setState(({ loading }: MDHCollectionState) => {
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
        const { loading, collection, not_found: notFound, failed } = this.state;
        const { collection: collectionName, client, results_loading_delay } = this.props;
        
        // TODO; Render loading indicator
        if (loading) return `Loading...`;

        // when something went wrong, render an error
        if (failed) return `Something went wrong: ${failed}`;

        // when the collection wasn't found, render the 404 page
        if (notFound !== undefined) return <MDHCollectionNotFound name={collectionName} />;

        // when we have a single collection, render it
        if (collection !== undefined) return <MDHCollectionSearch client={client} collection={collection} results_loading_delay={results_loading_delay} />

        // else render nothing
        return null;
    }
}