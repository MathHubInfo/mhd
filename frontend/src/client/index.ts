import CodecManager from "../codecs"
import type Codec from "../codecs/codec"
import type { TableColumn } from "../components/wrappers/table"
import ExporterManager from "../exporters/manager"
import type { MHDFilter, ParsedMHDCollection } from "./derived"
import type { TDRFPagedResponse, TMHDCollection, TMHDItem, TMHDPreFilter, TMHDProperty } from "./rest"

export class MHDBackendClient {
    /**
     * @param base_url the Base URL for all API requests
     * @param codec_manager interface to all known codecs
     */
    constructor(public base_url: string, public codec_manager: CodecManager, public exporter_manager: ExporterManager) { }

    private static instance: MHDBackendClient
    static getInstance(): MHDBackendClient {
        if (MHDBackendClient.instance) {
            return MHDBackendClient.instance
        }
        const base_url = (typeof window === "undefined") ? process.env.DJANGO_URL + "/api" : "/api"
        MHDBackendClient.instance = new MHDBackendClient(base_url, CodecManager.getInstance(), ExporterManager.getInstance())
        return MHDBackendClient.instance
    }

    /**
     * Fetches json data from the api given the url and provided parameters. 
     * Rejects when the request fails
     */
    async fetchJSON<T>(url: string, params: {[key: string]: string} = {}): Promise<T> {
        // build an array of "key=params"
        const paramAry = Object.keys(params).filter(k => params[k] !== "").map(key => {
            return key + "=" + encodeURIComponent(params[key])
        })

        // make it into a string
        const paramsString = (paramAry.length > 0) ? ("?" + paramAry.join("&")) : ""

        // use fetch()
        const res = await fetch(this.base_url + url + paramsString, {
            method: "GET",
            headers: { "Content-Type": "application/json; charset=utf-8" },
        })

        // reject if things failed
        if (!res.ok) throw new ResponseError(res)

        // and return the json
        return res.json()
    }

    /** Fetches information about a collection with the given name or rejects */
    async fetchCollection(name: string): Promise<TMHDCollection> {
        return this.fetchJSON<TMHDCollection>(`/schema/collections/${name}/`)
    }

    /** Fetches information about a collection and an item within the collection */
    async fetchCollectionAndItem(name: string, id: string): Promise<[TMHDCollection, TMHDItem<{}>]> {
        return Promise.all([
            this.fetchCollection(name),
            this.fetchJSON<TMHDItem<{}>>(`/item/${name}/${id}/`),
        ])
    }

    /** Fetches a list of all collections */
    async fetchCollections(page = 1, per_page = 20): Promise<TDRFPagedResponse<TMHDCollection>> {
        return this.fetchJSON("/schema/collections/", {
            page: page.toString(),
            per_page: per_page.toString(),
        })
    }

    /** parses a collection and prepares appropriate derived values */
    parseCollection(collection: TMHDCollection): ParsedMHDCollection {

        const propMap = new Map<string, TMHDProperty>()
        const nameMap = new Map<string, string>()
        const codecMap = new Map<string, Codec>()
        const columnMap = new Map<string, TableColumn<TMHDItem<any>>>()

        const propertySlugs = collection.properties.map(p => {
            const { slug, codec } = p

            propMap.set(slug, p)
            nameMap.set(slug, p.displayName)

            const c = this.codec_manager.getWithFallback(codec)
            codecMap.set(slug, c)
            
            columnMap.set(slug, c.makeReactTableColumn(p))

            return p.slug
        })

        const exporterInstances = collection.exporters.map(slug => this.exporter_manager.get(slug)).filter(x => x !== undefined)

        const defaultPreFilter = (collection.preFilters.length > 0) ? collection.preFilters[0] : undefined
        return { propMap, nameMap, propertySlugs, exporterInstances, codecMap, columnMap, defaultPreFilter, ...collection }
    }

    /** Fetches information about a set of collection items */
    async fetchItems<T extends {}>(collection: ParsedMHDCollection, properties: string[], pre_filter: TMHDPreFilter | undefined, filters: MHDFilter[], page_number = 1, per_page = 100, order: string): Promise<TDRFPagedResponse<TMHDItem<T>>> {
        // Build the filter params
        const params = {
            filter: MHDBackendClient.buildFilter(pre_filter, filters),
            properties: properties.join(","),
            page: page_number.toString(),
            per_page: per_page.toString(),
            order: MHDBackendClient.buildSortOrder(collection, properties, order),
        }

        // fetch the results
        return this.fetchJSON<TDRFPagedResponse<TMHDItem<T>>>(`/query/${collection.slug}/`, params)
    }

    /** hashes the parameters to the fetchItems function */
    static hashFetchItems(collection: ParsedMHDCollection, properties: string[], pre_filter: TMHDPreFilter | undefined, filters: MHDFilter[], order: string, page_number = 1, per_page = 100): string {
        const hash = {
            collection: collection.slug,
            pre_filter: pre_filter,
            filters: filters.filter(f => f.value !== null),
            properties: properties,
            order: order,
            page_number: page_number,
            per_page: per_page,
        }
        return JSON.stringify(hash)
    }

    /** Fetches the number of items in a collection */
    async fetchItemCount(collection: ParsedMHDCollection, pre_filter: TMHDPreFilter | undefined, filters: MHDFilter[]): Promise<number> {
        // Build the filter params
        const params = {
            filter: MHDBackendClient.buildFilter(pre_filter, filters),
        }

        // fetch the results
        const res = await this.fetchJSON<TDRFPagedResponse<{count: number}>>(`/query/${collection.slug}/count/`, params)
        return res.count
    }

    /** hashes the parameters to the fetchItemCount function */
    static hashFetchItemCount(collection: ParsedMHDCollection, pre_filter: TMHDPreFilter | undefined, filters: MHDFilter[]): string {
        const hash = {
            collection: collection.slug,
            pre_filter: pre_filter,
            filters: filters.filter(f => f.value !== null),
        }
        return JSON.stringify(hash)
    }

    /** give a set of filters, build a filter URL */
    static buildFilter(pre_filter: TMHDPreFilter | undefined, filters: MHDFilter[]): string {
        const filterAry = filters.filter(f => f.value !== null).map(f => `(${f.slug}${f.value})`)
        return (pre_filter ? [`(${pre_filter.condition})`, ...filterAry] : filterAry).join("&&")
    }

    /** builds a sort order string to pass to the backend */
    static buildSortOrder(collection: ParsedMHDCollection, properties: string[], order: string): string {
        const propName = (n: string) => (n.startsWith("+") || n.startsWith("-")) ? n.substring(1) : n // function to extract the property name

        const sorder = order.split(",") // array containing the final order
        
        // add properties which have not been ordered
        const unordered = new Set(collection.propertySlugs)
        sorder.forEach(n => unordered.delete(propName(n)))
        unordered.forEach(e => sorder.push(e))
        
        // find all the properties that we want to filter by in the appropriate order
        return sorder
            .filter(n => properties.includes(propName(n))) // filter by queries properties
            .filter(n => collection.propMap.has(propName(n))) // filter by known properties
            .filter(n => collection.codecMap.get(propName(n))!.ordered) // filter by orderable properties
            .map(n => {
                if(n.startsWith("+") || n.startsWith("-")) return n
                const order = collection.codecMap.get(n)!.ordered
                const sign = (order === true || order === "+") ? "+" : "-"
                return `${sign}${n}`
            })
            .join(",")
    }
}

/** Indicates an error while fetching a request */
export class ResponseError implements Error {
    constructor(readonly response: Response) {}

    readonly name = "ResponseError"
    readonly message = `Request to ${this.response.url} failed. `

    /** indicates if the response returned the not found status */
    readonly isNotFound = this.response.status === 404
}