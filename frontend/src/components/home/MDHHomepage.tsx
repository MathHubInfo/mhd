import React from 'react';
import { Container, Row, Col, Button, ListGroup, ListGroupItem } from "reactstrap";

import { TMDHCollection, TDRFPagedResponse } from "../../client/rest"
import { MDHBackendClient } from "../../client";

interface MDHHomePageProps {
    /** client to fetch more data */
    client: MDHBackendClient;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MDHHomePageState {
    /** are we currently loading */
    loading: boolean;

    /** the current collections */
    collections: TMDHCollection[];

    /** the current page number */
    page: number;

    /** the total number of pages */
    total_pages: number;

    /** for when we have multiple  */
    last_update: number;
}

/** Renders a collection that is not found */
export default class MDHHomePage extends React.Component<MDHHomePageProps, MDHHomePageState> {
    
    state: MDHHomePageState = {
        loading: false,
        collections: [],
        page: 1,
        total_pages: -1,
        last_update: 0,
    }

    /** schedules fetching of a result page */
    private scheduleDataFetch = async () => {
        // because we are in a non-blocking (async) situation, we may have multiple
        // updates at the same time. To keep track if a newer one has already been applied
        // we use the current time, which is strictly increasing
        const time = new Date().getTime();

        
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {results_loading_delay} ms. 
        setTimeout(() => {
            this.setState(({ last_update }: MDHHomePageState) => {
                if (last_update >= time) return null; // an update was applied
                return { loading: true };
            });
        }, this.props.results_loading_delay);


        // fetch the results, fallback to the empty result
        let results: TDRFPagedResponse<TMDHCollection> = {
            count: -1,

            next: null,
            previous: null,
            num_pages: 0,

            results: [],
        };
        try {
            results = await this.props.client.fetchCollections(this.state.page)
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.error(e);
        }

        // for introducing a dummy delay of 2 seconds, uncomment the following line
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        this.setState(({ last_update }: MDHHomePageState) => {
            if (last_update > time) return null; // newer update was already applied

            return {
                loading: false,
                collections: results.results,
                total_pages: results.num_pages,
                last_update: time,
            };
        });
    }

    /** render the next page */
    private nextPage = () => {
        this.setState(({page, total_pages}: MDHHomePageState) => {
            if (page + 1 > total_pages) return null;
            return { page: page + 1 };
        })
    }

    /** render the previous page */
    private prevPage = () => {
        this.setState(({page}: MDHHomePageState) => {
            if (page - 1 < 1) return null;
            return { page: page - 1 };
        })
    }

    componentDidUpdate(_: MDHHomePageProps, { page }: MDHHomePageState) {
        // if the page number changed, fetch new data
        if (this.state.page !== page) {
            this.scheduleDataFetch();
        }
    }

    componentDidMount() {
        this.scheduleDataFetch();
    }

    renderContent(): React.ReactNode {
        const {loading, collections, page, total_pages} = this.state;

        // when loading, render a loading indicator
        // TODO: show an actual indicator once the theme is fixed
        if (loading) return "Loading";

        const shouldNextPage = (page + 1 <= total_pages);
        const shouldPrevPage = (page - 1 >= 1);


        return (
            <Container>
                <p></p>
                <div>
                    <ListGroup>
                        {collections.map(c => (
                            <ListGroupItem key={c.slug}>
                                <a href={`/${c.slug}`}>
                                    {c.displayName}
                                </a>
                            </ListGroupItem>
                        ))}
                    </ListGroup>
                </div>
                <div className="buttons">
                    {shouldPrevPage && <Button onClick={this.prevPage}>Previous</Button>}
                    {shouldNextPage && <Button onClick={this.nextPage}>Next</Button>}
                </div>
            </Container>
        );
    }

    render() {
        return (
            <section className="bg-primary">
                <Container>
                    <Row>
                        <Col sm="12" md="4">
                            <h1 className="section-heading text-white">MathDataHub</h1>                 
                            <p>
                                MathDataHub is a system to provide universal infrastructure for Mathematical Data. 
                                Select a collection to get started browsing. 
                            </p>
                        </Col>
                        <Col sm="12" md="8">
                            {this.renderContent()}
                        </Col>
                    </Row>
                </Container>
            </section>
        );
    }
}