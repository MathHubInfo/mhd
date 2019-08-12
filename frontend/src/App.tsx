import React from 'react';

import { MDHBackendClient } from './client'
import { ParsedMDHCollection } from "./client/derived";
import MDHFrontend from "./components/MDHFrontend";

interface AppProps {
    /** the base api URL */
    api: string;
}

interface AppState {
    /** has fetching data failed */
    failed?: any;

    /** fetched information about the collection */
    collection?: ParsedMDHCollection;
}

/**
 * Entrypoint component that instantiates an API Client and fetches initial collection information
 */
export default class App extends React.Component<AppProps, AppState> {
    private client = new MDHBackendClient(this.props.api);

    state: AppState = {};

    async componentDidMount() {
        try {
            // grab the collection name from the url
            const collectionName = getCollectionParameter();
            if (collectionName === null) throw new Error("CollectionName missing from URL");

            // fetch the name of the collection and store it in state
            const collection = await this.client.fetchCollection(collectionName);
            this.setState({collection});
        
        // handle errors gracefully
        } catch(e) {
            if (process.env.NODE_ENV !== "production") console.error(e);

            this.setState({failed: e});
        }
    }

    render() {
        const { failed, collection } = this.state;

        // for when there is an error
        if (failed) return `Something went wrong: ${failed}`;

        // for when we are still loading
        if (collection === undefined) return 'Loading ...';

        // render the actual app
        return <MDHFrontend client={this.client} collection={collection}></MDHFrontend>;
    }
}

/** extracts the name of the collection from the URL */
function getCollectionParameter(): string | null {
    const maybeCollection = /\/([a-zA-Z0-9-_]+)/g.exec(window.location.pathname);
    return ((!maybeCollection || maybeCollection.length !== 2) ? null : maybeCollection[1]);
}