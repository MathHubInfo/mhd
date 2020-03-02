/** @file contains types directly returned from the REST API */

/** a MathDataHub Collection */
export interface TMHDCollection {
    slug: string;
    displayName: string;
    flag_large_collection: boolean;

    description: string;
    url: string | null;

    count: number | null;

    preFilters: TMHDPreFilter[]

    metadata?: any;
    
    properties: TMHDProperty[];
}

export interface TMHDPreFilter {
    description: string,
    condition: string,
    count: number | null,
}

/** a MathDataHub Property */
export interface TMHDProperty {
    slug: string;
    displayName: string;

    description: string;
    url: string | null;

    metadata?: any;

    codec: string;
}

/** an item in a collection */
export type TMHDItem<P extends {}> = P & {"_id": string};

/** a paged Django Rest Framework Response */
export interface TDRFPagedResponse<T> {
    /** the total number of results */
    count: number;
    
    /** url to the next page (if any) */
    next: string | null;
    /** url to the previous page (if any) */
    previous: string | null;

    /** the total number of pages */
    num_pages: number;

    /** the results themselves */
    results: T[];
}