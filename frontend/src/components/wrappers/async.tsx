import { faL } from "@fortawesome/free-solid-svg-icons";
import React from "react"
import { isProduction } from "../../controller";

type AsyncLoaderOptions<Flags, State, Data> = {
    /* computes the initial state */
    initialState: (flags: Flags) => State

    /* loader loads data from the backend */
    loader: (flags: Flags, state: State) => Promise<Data>;

    /** hashes to quickly check if two flags and parameter sets are identical */
    flagsHash: (flags: Flags) => string
    stateHash: (state: State) => string

    /** delay (in milliseconds) after which things show up as loading */
    resultsLoadingDelay?: number
}

type AsyncProps<Flags, State, Data> = {
    data: Data | null
    loading: boolean
    flags: Flags
    state: State
    onUpdateState: (state: State) => void
    onResetState: (flags: Flags) => void
}

type SyncState<Flags, State, Data> = Omit<AsyncProps<Flags, State, Data>, "onUpdateState" | "onResetState" | "state"> & {
    /** when true, force an update */
    forceUpdate: boolean;

    /** time we last updated */
    lastUpdate: number;
}

type SyncProps<T> = Omit<T, "loading" | "data">

export default function AsyncLoader<F, S, D, T extends AsyncProps<F, S, D>>(
    Wrapped: React.ComponentType<T>,
    Options: AsyncLoaderOptions<F, S, D>,
): React.ComponentType<SyncProps<T>> {
    const Component = class extends React.Component<SyncProps<T>, SyncState<F, S, D>> {
        static displayName = `AsyncLoader(${getDisplayName(Wrapped)})`

        state: SyncState<F, S, D> = {
            data: null,
            loading: true,
            flags: this.props.flags,
            forceUpdate: false,
            lastUpdate: 0,
        }

        private updateCounter = 0;
        private readonly scheduleDataUpdate = async () => {
            // because we are in a non-blocking (async) situation, we may have multiple
            // updates at the same time.
            // to make sure only the newest one wins, we use an increasing counter here.
            this.updateCounter++
            const updateID = this.updateCounter
    
            // we want to set loading to true, to display a loading indicator
            // however, to avoid flashing this indicator when loading is quick
            if (typeof Options.resultsLoadingDelay === 'number') {
                setTimeout(() => {
                    if (!this.mounted) return // if we're no longer mounted
                    this.setState(({ lastUpdate }) => {
                        if (lastUpdate >= updateID) return null // an update was applied
                        return { loading: true }
                    })
                }, Options.resultsLoadingDelay)
            }

            // now we can fetch the current data
            // but handle everything as having been loaded 
            let data: D | null = null;
            try {
                data = await Options.loader(this.props.flags, this.props.state)
            } catch(e) {
                if (!isProduction) console.error(e)
            }

            if (!this.mounted) return // if we're no longer mounted
            this.setState(({ lastUpdate }) => {
                if (lastUpdate > updateID) return null // newer update was already applied
    
                return {
                    lastUpdate: updateID,
                    loading: false,
                    data: data,
                }
            })
        }

        private mounted = false
        componentDidMount(): void {
            this.mounted = true
            this.scheduleDataUpdate()
        }
        componentWillUnmount(): void {
            this.mounted = false
        }

        componentDidUpdate(prevProps: SyncProps<T>, prevState: SyncState<F, S, D>) {
            // whenever the (user-provided) flags changed
            // then we need to reset the internal state and re-compute everything
            if (Options.flagsHash(prevProps.flags) !== Options.flagsHash(this.props.flags)) {
                // tell the parent to reset the state, which *should* reset the props.state
                this.props.onResetState(this.props.flags)

                this.setState({
                    data: null,
                    loading: true,
                    flags: this.props.flags,
                    forceUpdate: true,
                })

                return
            }

            // disable forceUpdate, then schedule the data update!
            if (this.state.forceUpdate || Options.stateHash(prevProps.state) !== Options.stateHash(prevProps.state)) {
                this.setState({ forceUpdate: false }, () => this.scheduleDataUpdate())
            }

        }

        // onUpdateState updates the state of the parent
        private readonly onUpdateState = (state: S) => {
            this.props.onUpdateState(state)
        }
        render() {
            const props = {
                ...this.props,
                data: this.state.data,
                state: this.props.state,
                onUpdateState: this.onUpdateState,
            } as T
            return <Wrapped {...props} />
        }
    }
    return Component
}

function getDisplayName(WrappedComponent) {
    return WrappedComponent.displayName || WrappedComponent.name || "Component"
}