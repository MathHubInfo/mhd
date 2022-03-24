import { TableState } from "./components/wrappers/table";
import { MHDFilter } from "./client/derived";
import { TMHDPreFilter } from "./client/rest";

// TODO: pre_filter in the url
export interface MHDCollectionSearchState extends TableState {
    /** the set of applied filters */
    filters: MHDFilter[];

    /** selected pre-filter */
    pre_filter?: TMHDPreFilter;

    /** the set of selected columns */
    columns: string[];

    /** the widths of each of the columns */
    widths: number[] | undefined;
}

function valueToString(value: any) {
    if (value === undefined) value = null;
    return JSON.stringify(value);
}

function stringToValue(value: string): any {
    const v = JSON.parse(value);
    return v === null ? undefined : v;
}

/**
 * (Potentially lossy) encoding of state into the URL
 */
export function encodeState(state: MHDCollectionSearchState) {
    return Object.entries({...state, widths: undefined}).map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(valueToString(v))}`
    ).join('&');
}

/**
 * Decodes some part of the state from the url
 * @param state
 */
export function decodeState(state: string): MHDCollectionSearchState | undefined {
    if (state === "") return;

    // decode the url keys as JSON valuys
    const sobj: Record<string, any> = {};
    try {
        state.split('&').forEach(e => {
            const uc = e.split('=');
            if (uc.length !== 2) return;
            
            // only accept these keys
            const key = decodeURIComponent(uc[0]);
            if (['per_page', 'page', 'filters', 'columns', 'widths'].indexOf(key) === -1) return;
            
            const value = decodeURIComponent(uc[1]);
            sobj[key] = stringToValue(value);
        });
    } catch(_) {
        return;
    }

    return sobj as MHDCollectionSearchState;
}
