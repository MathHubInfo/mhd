import React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { MDHBackendClient } from './client';
import CodecManager from "./codecs/";
import MDHFooter from "./components/common/MDHFooter";
import MDHHeader from "./components/common/MDHHeader";
import MDHCollection from "./components/routes/collection";
import MDHHomePage from "./components/routes/home";

interface AppProps {
    /** the base api URL */
    api?: string;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

/**
 * Entrypoint component that instantiates an API Client and fetches initial collection information
 */
export default class App extends React.Component<AppProps> {
    private client = new MDHBackendClient(this.props.api || '/api', CodecManager.getInstance());

    private homeComponent = (props: RouteComponentProps<{}>) => {
        const { results_loading_delay } = this.props;
        return <MDHHomePage client={this.client} results_loading_delay={results_loading_delay} />
    }

    private collectionComponent = (props: RouteComponentProps<{collection: string}>) => {
        const { match: {params: { collection }}} = props;
        const { results_loading_delay } = this.props;
        return <MDHCollection client={this.client} key={collection} collection={collection} results_loading_delay={results_loading_delay} />;
    }

    render() {
        return (
            <>
                <MDHHeader />
                
                <Switch>
                    <Route exact path={'/'} component={this.homeComponent}></Route>
                    <Route path='/:collection' component={this.collectionComponent}></Route>
                </Switch>

                <MDHFooter />
            </>
        );
    }
}
