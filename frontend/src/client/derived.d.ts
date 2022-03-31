import {TMHDCollection, TMHDProperty, TMHDPreFilter} from './rest';
import Codec from "../codecs/codec";
import { TableColumn } from "../components/wrappers/table";

/**
 * A parsed collection with all derived information needed by any component anywhere
 */
export interface ParsedMHDCollection extends TMHDCollection {
    /** a map from slug to slug-schema */
    propMap: Map<string, TMHDProperty>

    /** a map from slug to names */
    nameMap: Map<string, string>

    /** the default pre-filter */
    defaultPreFilter?: TMHDPreFilter,

    /* the slugs of all properties */
    propertySlugs: string[]

    /** list of the instantiated codecs for this renderer */
    codecMap: Map<string, Codec<any, any>>

    /** columns of this property */
    columnMap: Map<string, TableColumn<any>>
}

/** a single instantiated filter */
export interface MHDFilter {
    slug: string;
    uid: number;
    initial: boolean;
    value: string | null;
}
