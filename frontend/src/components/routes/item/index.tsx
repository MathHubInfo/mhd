import React from 'react';
import { ParsedMDHCollection } from "../../../client/derived";
import { MDHBackendClient, ResponseError } from "../../../client";
import { TMDHItem } from "../../../client/rest";
import MDHMain, { MDHLoading } from "../../common/MDHMain";
import MDHItemNotFound from './notfound';
import MDHItemView from './item';

interface MDHItemProps {
    /** client being used by the backend */
    client: MDHBackendClient;

    /** name of the collection to render */
    collection: string;

    /** id of the item to render */
    uuid: string;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MDHItemState {
    /** are we loading */
    loading?: boolean;

    /** when set, render this collection */
    data?: [ParsedMDHCollection, TMDHItem<{}>];

    /** when set, render an error page */
    failed?: any;

    /** when set, render a not found page with the given collection name */
    not_found?: boolean;

}

/**
 * Loads item data and either loads the Item page or the not found page
 */
export default class MDHItem extends React.Component<MDHItemProps, MDHItemState> {
    state: MDHItemState = {
        loading: true,
    }

    async componentDidMount() {
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {results_loading_delay} ms. 
        setTimeout(() => {
            this.setState(({ loading }: MDHItemState) => {
                if (loading !== undefined) return null; // an update was applied
                return { loading: true };
            });
        }, this.props.results_loading_delay);


        // update the data using the api client
        try {
            const collection = await this.props.client.fetchCollectionAndItem(this.props.collection, this.props.uuid);
            this.setState({
                loading: false,
                data: collection
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
        const { loading, data, not_found: notFound, failed } = this.state;
        const { collection: collectionName, uuid } = this.props;

        // Render a loading indicator when loading
        if (loading) return <MDHLoading />;

        // when something went wrong, render an error
        if (failed) return <MDHMain title="Error" leftHead={`Something went wrong: ${failed}`} />;

        // when the collection wasn't found, render the 404 page
        if (notFound !== undefined) return <MDHItemNotFound collection={collectionName} uuid={uuid} />;

        // when we have data, render it
        if (data !== undefined) return <MDHItemView collection={data[0]} item={data[1]} />

        // else render nothing
        return null;
    }
}