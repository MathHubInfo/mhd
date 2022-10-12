import type Codec from "../codecs/codec"
import type { TableColumn } from "../components/wrappers/table"
import type { CollectionExporter } from "../exporters"
import type { TMHDCollection, TMHDPreFilter, TMHDProperty } from "./rest"

/**
 * A parsed collection with all derived information needed by any component anywhere
 */
export type ParsedMHDCollection = TMHDCollection & {
    /** a map from slug to slug-schema */
    propMap: Map<string, TMHDProperty>

    /** a map from slug to names */
    nameMap: Map<string, string>

    /** the default pre-filter */
    defaultPreFilter?: TMHDPreFilter,

    /* the slugs of all the default properties */
    defaultPropertySlugs: string[],
    
    /* the slugs of all properties */
    propertySlugs: string[],

    /** all of the exporter instances */
    exporterInstances: CollectionExporter[],

    /** list of the instantiated codecs for this renderer */
    codecMap: Map<string, Codec<any, any>>

    /** columns of this property */
    columnMap: Map<string, TableColumn<any>>
}

/** a single instantiated filter */
export type MHDFilter = {
    slug: string;
    value: string | null;
}
