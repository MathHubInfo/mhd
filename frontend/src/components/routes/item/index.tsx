import React from 'react';
import { ParsedMHDCollection } from "../../../client/derived";
import { MHDBackendClient, ResponseError } from "../../../client";
import { TMHDItem } from "../../../client/rest";
import MHDMain, { MHDLoading } from "../../common/MHDMain";
import MHDItemView from './item';

interface MHDItemProps {
    /** client being used by the backend */
    client: MHDBackendClient;

    /** name of the collection to render */
    collection: string;

    /** id of the item to render */
    uuid: string;

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface MHDItemState {
    /** are we loading */
    loading?: boolean;

    /** when set, render this collection */
    data?: [ParsedMHDCollection, TMHDItem<{}>];

    /** when set, render an error page */
    failed?: any;

    /** when set, render a not found page with the given collection name */
    not_found?: boolean;

}

/**
 * Loads item data and either loads the Item page or the not found page
 */
export default class MHDItem extends React.Component<MHDItemProps, MHDItemState> {
    state: MHDItemState = {
        loading: true,
    }

    async componentDidMount() {
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {results_loading_delay} ms. 
        setTimeout(() => {
            this.setState(({ loading }: MHDItemState) => {
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

        // Render a loading indicator when loading
        if (loading) return <MHDLoading />;

        // when something went wrong, render an error
        if (failed) return <MHDMain title="Error" leftHead={`Something went wrong: ${failed}`} />;

        // when the collection wasn't found, render the 404 page
        if (notFound !== undefined) return "Not Found";

        // when we have data, render it
        if (data !== undefined) return <MHDItemView collection={data[0]} item={data[1]} />

        // else render nothing
        return null;
    }
}