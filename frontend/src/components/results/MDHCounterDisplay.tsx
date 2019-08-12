import React from 'react';

import { MDHBackendClient } from '../../client';
import { ParsedMDHCollection, MDHFilter } from '../../client/derived';

interface MDHCounterDisplayProps {
    /** the backend  */
    client: MDHBackendClient;

    /** the current collection (if any) */
    collection: ParsedMDHCollection;

    /** current filters */
    filters: MDHFilter[];
}

interface MDHCounterDisplayState {
    /** boolean indicating if the component is currently loading data */
    loading: boolean;

    /** count the current number of elements, set to NaN to indicate failure */
    count: number;

    /** time when the counter was last updated */
    last_update: number;
}

const COUNTER_MIN_LOADING_TIMEOUT = 100;

/**
 * Displays and updates a counter of the current v
 */
export default class MDHCounterDisplay extends React.Component<MDHCounterDisplayProps, MDHCounterDisplayState> {
    state: MDHCounterDisplayState = {
        loading: true,
        count: NaN,
        last_update: 0,
    }

    /**
     * Schedules an update for the counter
     */
    private scheduleCountUpdate = async () => {
        // because we are in a non-blocking (async) situation, we may have multiple
        // updates at the same time. To keep track if a newer one has already been applied
        // we use the current time, which is strictly increasing
        const time = new Date().getTime();

        
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {COUNTER_MIN_LOADING_TIMEOUT} ms. 
        setTimeout(() => {
            this.setState(({ last_update }: MDHCounterDisplayState) => {
                if (last_update >= time) return null; // an update was applied
                return { loading: true };
            });
        }, COUNTER_MIN_LOADING_TIMEOUT);


        // update the counter using the APIClient
        // fallback to 'NaN' when an error occurs, and log the error during development
        let count = NaN;
        try {
            count = await this.props.client.fetchItemCount(this.props.collection.slug, this.props.filters);
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') console.error(e);
        }

        // for introducing a dummy delay of 2 seconds, uncomment the following line
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        this.setState(({ last_update }: MDHCounterDisplayState) => {
            if (last_update > time) return null; // newer update was already applied

            return {
                loading: false,
                count,
                last_update: time,
            };
        });
    }

    componentDidMount() {
        this.scheduleCountUpdate();
    }

    componentDidUpdate(prevProps: MDHCounterDisplayProps) {
        // compute old hash
        const {filters: prevFilter, collection: prevCollection} = prevProps;
        const oldHash = MDHBackendClient.hashFetchItemCount(prevCollection.slug, prevFilter);

        // compute new hash
        const { filters: newFilter, collection: newCollection } = this.props;
        const newHash = MDHBackendClient.hashFetchItemCount(newCollection.slug, newFilter);

        // if we have different hashes, we need to re-count
        if (oldHash !== newHash) {
            this.scheduleCountUpdate();
        }
    }

    render() {
        const { loading, count } = this.state;
        
        // TODO: Show a spinner here once the bootstrap theme is fixed
        if(loading) return <p>Matches found: <i>Loading...</i></p>;

        // when something went wrong, display an error
        if (isNaN(count)) return <p>Matches found: <i>Error</i></p>

        // else return the actual count
        return <p>Matches found: <i>{count}</i></p>;
    }
}