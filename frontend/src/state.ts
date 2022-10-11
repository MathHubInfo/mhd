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
export function encodeState({ query, columns, order, per_page, page }: PageState) {
    const { filters } = query ?? { filters: [] }
    return ([
        ["filters", filters],
        ["columns", columns],
        ["order", order],
        ["per_page", per_page],
        ["page", page],
    ] as Array<[string, any]>).map(
        ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(valueToString(v))}`
    ).join("&")
}

/**
 * Decodes some part of the state from the url
 * @param state
 */
export function decodeState(state: string): PageState | undefined {
    if (state === "") return

    // decode the url keys as JSON valuys
    const query: Record<string, any> = {}

    state.split("&").forEach(e => {
        const index = e.indexOf("=")
        if (index === -1) return
        
        const key = e.substring(0, index)
        const value = e.substring(index + 1)

        try {
            query[decodeURIComponent(key)] = stringToValue(decodeURIComponent(value))
        } catch(_) {}
    })
    
    // decode from the query object
    const { filters, columns, order, per_page, page } = query
    const decoded: PageState = {
        query: { filters },
        columns,
        order: order ?? "",
        per_page,
        page,
    }

    // ensure that the state is valid
    if (!validateState(decoded)) return
    return decoded
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
    if (!Array.isArray(filters) || !filters.every(isFilter)) return false

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
    const { slug, value, uid, inital, initialEdit, ...extra } = candidate

    if(Object.keys(extra).length !== 0) return false
    if (!isString(slug)) return false
    if (!isInteger(uid) && !isString(uid)) return false
    // if (inital !== undefined && !isBoolean(inital)) return false
    if (initialEdit !== undefined && !isBoolean(initialEdit)) return false
    return value == null || typeof value === "string"
}

function isOrder(candidate: any): candidate is string {
    return isString(candidate)
}
