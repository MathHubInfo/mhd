import React from 'react';
import { Route, RouteComponentProps, Switch } from 'react-router-dom';
import { MHDBackendClient } from './client';
import CodecManager from "./codecs/";

import MHDFooter from "./components/common/MHDFooter";
import MHDHeader from "./components/common/MHDHeader";

import loadable from '@loadable/component'

const MHDCollectionFactory = loadable(() => import("./components/routes/collection"));
const MHDCollectionSearch = loadable(() => import("./components/routes/collection/search"));
const MHDCollectionAbout = loadable(() => import("./components/routes/collection/about"));

const MHDHomePage = loadable(() => import("./components/routes/home"));
const MHDItem = loadable(() => import("./components/routes/item"));
const Debug = loadable(() => import("./components/routes/debug"));
const About = loadable(() => import("./components/routes/about"));

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
    private client = new MHDBackendClient(this.props.api || '/api', CodecManager.getInstance());

    private homeComponent = (props: RouteComponentProps<{}>) => {
        const { results_loading_delay } = this.props;
        return <MHDHomePage client={this.client} results_loading_delay={results_loading_delay} />
    }

    private collectionSearchComponent = (props: RouteComponentProps<{collection: string}>) => {
        const { match: {params: { collection }}} = props;
        const { results_loading_delay } = this.props;
        return <MHDCollectionFactory component={MHDCollectionSearch} client={this.client} key={collection} collection={collection} results_loading_delay={results_loading_delay} />;
    }
    private collectionAboutComponent = (props: RouteComponentProps<{collection: string}>) => {
        const { match: {params: { collection }}} = props;
        const { results_loading_delay } = this.props;
        return <MHDCollectionFactory component={MHDCollectionAbout} client={this.client} key={collection} collection={collection} results_loading_delay={results_loading_delay} />;
    }
    private itemComponent = (props: RouteComponentProps<{collection: string, uuid: string}>) => {
        const { match: {params: { collection, uuid }}} = props;
        const { results_loading_delay } = this.props;
        
        return <MHDItem client={this.client} key={`${collection}/${uuid}`} collection={collection} uuid={uuid} results_loading_delay={results_loading_delay} />;
    }

    render() {
        return (
            <>
                <MHDHeader />
                
                <Switch>
                    <Route exact path='/' component={this.homeComponent}></Route>
                    <Route exact path='/about/' component={About}></Route>
                    <Route path='/item/:collection/:uuid' component={this.itemComponent}></Route>
                    <Route path='/collection/:collection/about' component={this.collectionAboutComponent}></Route>
                    <Route path='/collection/:collection' component={this.collectionSearchComponent}></Route>

                    {process.env.NODE_ENV !== "production" &&
                        <Route exact path='/debug/' component={Debug}></Route>
                    }
                </Switch>

                <MHDFooter />
            </>
        );
    }
}
