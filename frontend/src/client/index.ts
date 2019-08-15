import { ParsedMDHCollection, MDHFilter } from "./derived";
import { TMDHCollection, TMDHProperty, TDRFPagedResponse, TMDHItem } from "./rest";
import CodecManager from "../codecs";
import Codec from "../codecs/codec";
import { Column } from "react-table";

export class MDHBackendClient {
    /**
     * @param base_url the Base URL for all API requests
     * @param manager interface to all known codecs
     */
    constructor(public base_url: string, public manager: CodecManager) { }

    /**
     * Fetches json data from the api given the url and provided parameters. 
     * Rejects when the request fails
     */
    async fetchJSON<T>(url: string, params: {[key: string]: string} = {}): Promise<T> {
        // build an array of "key=params"
        const paramAry = Object.keys(params).filter(k => params[k] !== '').map(key => {
            return key + '=' + encodeURIComponent(params[key]);
        });

        // make it into a string
        const paramsString = (paramAry.length > 0) ? ('?' + paramAry.join("&")) : '';

        // use fetch()
        const res = await fetch(this.base_url + url + paramsString, {
            method: "GET",
            headers: { "Content-Type": "application/json; charset=utf-8" }
        });

        // reject if things failed
        if (!res.ok) throw new ResponseError(res);

        // and return the json
        return res.json();
    }

    /** Fetches information about a collection with the given name or rejects */
    async fetchCollection(name: string): Promise<ParsedMDHCollection> {
        const collection = await this.fetchJSON<TMDHCollection>(`/schema/collections/${name}`);
        return this.parseCollection(collection);
    }

    /** Fetches a list of all collections */
    async fetchCollections(page = 1, per_page = 20): Promise<TDRFPagedResponse<TMDHCollection>> {
        return this.fetchJSON(`/schema/collections/`, {
            page: page.toString(),
            per_page: per_page.toString()
        });
    }

    /** parses a collection and prepares appropriate derived values */
    private parseCollection(collection: TMDHCollection): ParsedMDHCollection {

        const propMap = new Map<string, TMDHProperty>();
        const codecMap = new Map<string, Codec>();
        const propertyColumns = new Map<string, Column<{}>>();

        const propertyNames = collection.properties.map(p => {
            const { slug, codec } = p;

            propMap.set(slug, p);

            const c = this.manager.getWithFallback(codec);
            codecMap.set(slug, c);
            propertyColumns.set(slug, c.makeReactTableColumn(p));

            return p.slug;
        });

        return { propMap, propertyNames, codecMap, columnMap: propertyColumns,  ...collection };
    }

    /** Fetches information about a set of collection items */
    async fetchItems<T extends {}>(collection: string, properties: string[], filters: MDHFilter[], page_number = 1, per_page = 100): Promise<TDRFPagedResponse<TMDHItem<T>>> {
        // Build the filter params
        const params = {
            filter: MDHBackendClient.buildFilter(filters),
            properties: properties.join(","),
            page: page_number.toString(),
            per_page: per_page.toString(),
        };

        // fetch the results
        return this.fetchJSON<TDRFPagedResponse<TMDHItem<T>>>(`/query/${collection}`, params);
    }

    /** hashes the parameters to the fetchItems function */
    static hashFetchItems(collection: string, properties: string[], filters: MDHFilter[], page_number = 1, per_page = 100): string {
        const hash = {
            collection: collection,
            filters: filters.filter(f => f.value !== null),
            properties: properties,
            page_number: page_number,
            per_page: per_page,
        }
        return JSON.stringify(hash);
    }

    /** Fetches the number of items in a collection */
    async fetchItemCount(collection: string, filters: MDHFilter[]): Promise<number> {
        // Counts the items in a collection
        const params = {
            filter: MDHBackendClient.buildFilter(filters),
            per_page: '1',
        };

        const response = await this.fetchJSON<TDRFPagedResponse<TMDHItem<{}>>>(`/query/${collection}`, params);
        return response.count;
    }

    /** hashes the parameters to the fetchItemCount function */
    static hashFetchItemCount(collection: string, filters: MDHFilter[]): string {
        const hash = {
            collection: collection,
            filters: filters.filter(f => f.value !== null),
        }
        return JSON.stringify(hash);
    }

    /** give a set of filters, build a filter URL */
    static buildFilter(filters: MDHFilter[]): string {
        return filters.filter(f => f.value !== null).map(f => `(${f.slug}${f.value})`).join("&&")
    }
}

/** Indicates an error while fetching a request */
export class ResponseError implements Error {
    constructor(readonly response: Response) {}

    readonly name = 'ResponseError';
    readonly message = `Request to ${this.response.url} failed. `

    /** indicates if the response returned the not found status */
    readonly isNotFound = this.response.status === 404;
}