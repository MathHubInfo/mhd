/** @file contains types directly returned from the REST API */

/** a MathHubData Collection */
export interface TMDHCollection {
    slug: string;
    displayName: string;

    description: string;
    url?: string;

    metadata?: any;
    
    properties: TMDHProperty[];
}

/** a MathHubData Property */
export interface TMDHProperty {
    slug: string;
    displayName: string;

    metadata?: any;

    codec: string;
}

/** an item in a collection */
export type TMDHItem<P extends {}> = P & {"_id": string};

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