import {MDHCollection} from './rest';

/**
 * A parsed collection with all derived information needed by any component anywhere
 */
export interface ParsedMDHCollection extends MDHCollection {
    /** a map from slug to slug-schema */
    propertyDictionary: {[slug: string]: MDHFilterSchema}

    /** a list of schema instances */
    propertyArray: MDHFilterSchema[]

    /* the names of all properties */
    propertyNames: string[]

    /** a list of renderers for this collection */
    propertyRenderers: {[slug: string]:Column<{}>}
}

/**
 * General description of a filter
 */
export interface MDHFilterSchema {
    /** is this a known filter */
    isFilter: boolean;

    /** what to display the filter as */
    display: string;
    
    /** slug (id) of this filter */
    slug: string;

    /** type of this filter */
    type: string;
}

/** a single instantiated filter */
export interface MDHFilter {
    slug: string;
    value: boolean | string | null;
}
