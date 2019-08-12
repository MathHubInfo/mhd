import { ParsedMDHCollection, MDHFilterSchema, MDHFilter } from "./derived";
import { MDHCollection, MDHProperty, DRFPagedResponse, MDHItem } from "./rest";
import { makePresenter } from "../presenters";

export class MDHBackendClient {
    /** @param base_url the Base URL for all API requests */
    constructor(public base_url: string) { }

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
        if (!res.ok) throw new Error(`Request to ${res.url} failed. `);

        // and return the json
        return res.json();
    }

    /** Fetches information about a collection with the given name or rejects */
    async fetchCollection(name: string): Promise<ParsedMDHCollection> {
        const collection = await this.fetchJSON<MDHCollection>(`/schema/collections/${name}`);
        return MDHBackendClient.parseCollection(collection);
    }

    /** parses a collection and prepares appropriate derived values */
    private static parseCollection(collection: MDHCollection): ParsedMDHCollection {
        const propertyArray = collection.properties.map(MDHBackendClient.getFilterSchema);
        const propertyNames = collection.properties.map(p => p.slug);

        const propertyDictionary: ParsedMDHCollection["propertyDictionary"] = {};
        propertyArray.forEach(p => { propertyDictionary[p.slug] = p; })

        const propertyRenderers: ParsedMDHCollection["propertyRenderers"] = {};
        collection.properties.forEach(p => { propertyRenderers[p.slug] = makePresenter(p); })
        
        return { propertyDictionary, propertyArray, propertyRenderers, propertyNames, ...collection };
    }

    /** given a property, return a description of the filter */
    private static getFilterSchema(prop: MDHProperty): MDHFilterSchema {
        return {
            isFilter: ["StandardBool", "StandardInt"].indexOf(prop.codec) > -1, // TODO: move into codec utils file
            display: prop.displayName,
            slug: prop.slug,
            type: prop.codec
        }
    }

    /** Fetches information about a set of collection items */
    async fetchItems<T extends {}>(collection: string, properties: string[], filters: MDHFilter[], page_number = 1, per_page = 100): Promise<DRFPagedResponse<MDHItem<T>>> {
        // Build the filter params
        const params = {
            filter: MDHBackendClient.buildFilter(filters),
            properties: properties.join(","),
            page: page_number.toString(),
            per_page: per_page.toString(),
        };

        // fetch the results
        return this.fetchJSON<DRFPagedResponse<MDHItem<T>>>(`/query/${collection}`, params);
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

        const response = await this.fetchJSON<DRFPagedResponse<MDHItem<{}>>>(`/query/${collection}`, params);
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