import { MDHProperty } from "./client/rest";
import { MDHFilterSchema } from "./client/derived";

/**
 * Returns a sorted array of keys
 * @param o Object to fetch keys of 
 */
export function sortedKeys(o: any): string[] {
    const keys = Object.keys(o);
    const sorted = keys.sort();
    const filtered = sorted.filter((f) => !(o[f] === null))
    return filtered;
}

/**
 * Gets a query url given a JSON-encoded version of parameters
 * @param {string} par 
 * @returns {string}
 */
export function getQueryURI(par?: string | null): string {
    if (par === undefined || par === null) return "";

    const parArray = JSON.parse(par);
    
    var accumulator = ""
    for (var i = 0; i < parArray.length; i++) {
        if (i > 0) accumulator += "&&";
        accumulator += parArray[i].slug + parArray[i].value;
    }
    
    return encodeURIComponent(accumulator);
}

export function getFilterObject(o: MDHProperty): MDHFilterSchema {
    return {
        isFilter: ["StandardBool", "StandardInt"].indexOf(o.codec) > -1, // TODO: move into codec utils file
        display: o.displayName,
        slug: o.slug,
        type: o.codec
    }
}