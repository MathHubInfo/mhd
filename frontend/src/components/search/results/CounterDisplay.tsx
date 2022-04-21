import React from "react"

import { MHDBackendClient } from "../../../client"
import type { ParsedMHDCollection, MHDFilter } from "../../../client/derived"
import type { TMHDPreFilter } from "../../../client/rest"

interface CounterDisplayProps {
    /** the current collection (if any) */
    collection: ParsedMHDCollection;

    pre_filter?: TMHDPreFilter;

    /** current filters */
    filters: MHDFilter[];

    /** timeout under which to not show the loading indicator */
    results_loading_delay: number;
}

interface CounterDisplayState {
    /** boolean indicating if the component is currently loading data */
    loading: boolean;

    /** count the current number of elements, set to NaN to indicate failure */
    count: number;

    /** time when the counter was last updated */
    last_update: number;
}

/**
 * Displays and updates a counter of the current v
 */
export default class CounterDisplay extends React.Component<CounterDisplayProps, CounterDisplayState> {
    state: CounterDisplayState = {
        loading: false,
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
        const time = new Date().getTime()

        
        // we want to set loading to true, to display a loading indicator
        // however, to avoid flashing this indicator when loading is quick
        // we only display this after {results_loading_delay} ms. 
        setTimeout(() => {
            this.setState(({ last_update }: CounterDisplayState) => {
                if (last_update >= time) return null // an update was applied
                return { loading: true }
            })
        }, this.props.results_loading_delay)


        // update the counter using the APIClient
        // fallback to 'NaN' when an error occurs, and log the error during development
        let count = NaN
        try {
            count = await MHDBackendClient.getInstance().fetchItemCount(this.props.collection, this.props.pre_filter, this.props.filters)
        } catch (e) {
            if (process.env.NODE_ENV !== "production") console.error(e)
        }

        // for introducing a dummy delay of 2 seconds, uncomment the following line
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        this.setState(({ last_update }: CounterDisplayState) => {
            if (last_update > time) return null // newer update was already applied

            return {
                loading: false,
                count,
                last_update: time,
            }
        })
    }

    componentDidMount() {
        this.scheduleCountUpdate()
    }

    componentDidUpdate(prevProps: CounterDisplayProps, prevState: CounterDisplayState) {
        // compute old hash
        const { filters: prevFilter, pre_filter: prevPreFilter, collection: prevCollection } = prevProps
        const oldHash = MHDBackendClient.hashFetchItemCount(prevCollection, prevPreFilter, prevFilter)

        // compute new hash
        const { filters: newFilter, pre_filter: newPreFilter, collection: newCollection } = this.props
        const newHash = MHDBackendClient.hashFetchItemCount(newCollection, newPreFilter, newFilter)

        // if we have different hashes, we need to re-count
        if (oldHash !== newHash) {
            this.scheduleCountUpdate()
        }
    }

    render() {
        const { loading, count } = this.state
        
        // TODO: Show a spinner here once the bootstrap theme is fixed
        if(loading) return <>Matches found: <i>Loading...</i></>

        // when something went wrong, display an error
        if (isNaN(count)) return <>Matches found: <i></i></>

        // else return the actual count
        return <>Matches found: <i>{count}</i></>
    }
}