import React from 'react';
import { MDHBackendClient, ResponseError } from './client';
import { ParsedMDHCollection } from "./client/derived";
import MDHCollection from "./components/MDHCollection";
import MDHCollection404 from './components/MDHCollection404';
import MDHFooter from "./components/MDHFooter";
import MDHHomePage from "./components/home/MDHHomepage";


interface AppProps {
    /** the base api URL */
    api: string;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface AppState {
    /** we loaded for less than */
    initing: boolean;
    
    /** when set, render an error page */
    failed?: any;

    /** when set, render a not found page with the given collection name */
    notFound?: string;

    /** when set, render this collection */
    collection?: ParsedMDHCollection;

    /** when set, render an overview page with these collections */
    collections?: boolean;
}

/**
 * Entrypoint component that instantiates an API Client and fetches initial collection information
 */
export default class App extends React.Component<AppProps, AppState> {
    private client = new MDHBackendClient(this.props.api);

    state: AppState = {
        initing: true
    };

    /** fetches the collection pointed to by name and catches not found errors */
    private fetchCollection = async (name: string) => {
        try {
            const collection = await this.client.fetchCollection(name);
            this.setState({ collection, initing: false });
        } catch (e) {
            console.log(e);
            if ((e instanceof ResponseError) && e.isNotFound) {
                this.setState({ notFound: name, initing: false });
            } else {
                throw e;
            }
        }
    }

    async componentDidMount() {
        setTimeout(() => this.setState({ initing: false }), this.props.results_loading_delay);

        // grab the collection name from the url
        const collectionName = getCollectionParameter();

        try {
            if(collectionName !== null) {
                await this.fetchCollection(collectionName);
            } else {
                await this.setState({ collections: true, initing: false});
            }
        
        // handle errors gracefully
        } catch(e) {
            if (process.env.NODE_ENV !== "production") console.error(e);

            this.setState({failed: e, initing: false});
        }
    }

    renderContent(): React.ReactNode {
        const { failed, notFound, collection, collections } = this.state;
        const { results_loading_delay } = this.props;

        // when something went wrong, render an error
        if (failed) return `Something went wrong: ${failed}`;

        // when the collection wasn't found, render the 404 page
        if (notFound !== undefined) return <MDHCollection404 name={notFound} />;

        // if we fetched all collections, render the home page
        if (collections !== undefined) return <MDHHomePage client={this.client} results_loading_delay={results_loading_delay} />;

        // when we have a single collection, render it
        if (collection !== undefined) return <MDHCollection client={this.client} collection={collection} results_loading_delay={results_loading_delay} />

        // when all else fails, render a loading thing
        return 'Loading ...'
    }

    render() {
        const { initing } = this.state;

        return (
            <div style={{display: initing ? 'none' : 'initial' }}>
                {this.renderContent()}
                <MDHFooter />
            </div>
        );
    }
}

/** extracts the name of the collection from the URL */
function getCollectionParameter(): string | null {
    const maybeCollection = /\/([a-zA-Z0-9-_]+)/g.exec(window.location.pathname);
    return ((!maybeCollection || maybeCollection.length !== 2) ? null : maybeCollection[1]);
}