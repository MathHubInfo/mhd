import {TMDHCollection, TMDHProperty} from './rest';
import Codec from "../codecs/codec";

/**
 * A parsed collection with all derived information needed by any component anywhere
 */
export interface ParsedMDHCollection extends TMDHCollection {
    /** a map from slug to slug-schema */
    propMap: Map<string, TMDHProperty>

    /* the names of all properties */
    propertyNames: string[]

    /** list of the instantiated codecs for this renderer */
    codecMap: Map<string, Codec<any, any>>

    /** columns of this property */
    columnMap: Map<string, Column<any>>
}

/** a single instantiated filter */
export interface MDHFilter {
    slug: string;
    value: string | null;
}
