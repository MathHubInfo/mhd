import type { TableState } from "./components/wrappers/table"
import type { MHDFilter } from "./client/derived"
import type { TCollectionPredicate } from "./client"

// TODO: pre_filter in the url
export interface PageState extends TableState {
    /** the query */
    query: TCollectionPredicate;

    /** the set of selected columns */
    columns: string[];

    /** the order of the results */
    order: string;

    /** the widths of each of the columns */
    widths: number[] | undefined;
}

function valueToString(value: any) {
    if (value === undefined) value = null
    return JSON.stringify(value)
}

function stringToValue(value: string): any {
    const v = JSON.parse(value)
    return v === null ? undefined : v
}

/**
 * (Potentially lossy) encoding of state into the URL
 */
export function encodeState(state: PageState) {
    const copy = { ...state } as any
    copy.filters = copy.query.filters
    delete copy["query"]
    return Object.entries({ ...state, widths: undefined }).map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(valueToString(v))}`
    ).join("&")
}

const ALL_STATE_PROPS = ["per_page", "page", "filters", "columns", "widths", "order"]

/**
 * Decodes some part of the state from the url
 * @param state
 */
export function decodeState(state: string): PageState | undefined {
    if (state === "") return

    // decode the url keys as JSON valuys
    const sobj: Record<string, any> = {}
    try {
        state.split("&").forEach(e => {
            const uc = e.split("=")
            if (uc.length !== 2) return
            
            // only accept these keys
            const key = decodeURIComponent(uc[0])
            if (ALL_STATE_PROPS.indexOf(key) === -1) return
            
            const value = decodeURIComponent(uc[1])
            sobj[key] = stringToValue(value)
        })
    } catch(_) {
        return
    }

    // lift out the query parameters
    sobj["query"] = {
        filters: sobj["filters"],
    }
    delete sobj["filters"]

    // for backward compatibility, ensure that there is an order property!
    sobj["order"] = sobj["order"] ?? ""

    // ensure that the state is valid
    if (!validateState(sobj)) return

    return sobj
}

function validateState(candidate: Record<string, any>): candidate is PageState {
    const { per_page, page, query, columns, widths, order, ...extra } = candidate
    if(Object.keys(extra).length !== 0) return false // extra properties

    if (!isInteger(per_page)) return false
    if (!isInteger(page)) return false
    if (!Array.isArray(columns) || !columns.every(isString)) return false
    if (!isOrder(order)) return false

    if (!(widths === undefined || (Array.isArray(widths) && widths.every(isNonNegative)))) return false

    // check that the query object exists and has a "filters" property
    if (typeof query !== "object") return false
    const { filters, ...extraquery } = query
    if(Object.keys(extraquery).length !== 0) return false // extra properties
    if (!Array.isArray(filters) || !query.filters.every(isFilter)) return false

    return true
}

function isBoolean(candidate: any): candidate is boolean {
    return typeof candidate === "boolean"
}

function isNonNegative(candidate: any): candidate is number {
    return typeof candidate === "number" && isFinite(candidate) && candidate >= 0
}

function isInteger(candidate: any): candidate is number {
    return typeof candidate === "number" && isFinite(candidate) && (candidate % 1 === 0)
}

function isString(candidate: any): candidate is string {
    return typeof candidate === "string"
}

function isFilter(candidate: any): candidate is MHDFilter {
    const { slug, value, uid, initial, ...extra } = candidate

    if(Object.keys(extra).length !== 0) return false
    if (!isString(slug)) return false
    if (!isInteger(uid)) return false
    if (!isBoolean(initial)) return false
    return value == null || typeof value === "string"
}

function isOrder(candidate: any): candidate is string {
    return isString(candidate)
}
