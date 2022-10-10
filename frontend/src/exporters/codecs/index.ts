import { ClientSideExporter } from ".."
import type { TCollectionPredicate } from "../../client"
import { MHDBackendClient } from "../../client"
import type { ParsedMHDCollection } from "../../client/derived"
import type { TMHDItem, TMHDProperty } from "../../client/rest"

/** A CodecExporter represents an exporter for a specific codec */
export default abstract class CodecExporter<CodecType, Accumulator = Array<CodecType>> extends ClientSideExporter<TMHDProperty, Accumulator, Blob, Array<CodecType>> {
    /** export is a convenience function to export the given collection */
    async export(slug: string, property: string, query: TCollectionPredicate, order: string, onStep: (progress: number) => boolean): Promise<Blob> {
        const client = MHDBackendClient.getInstance()
        const collection = await client.fetchCollection(slug).then(c => client.parseCollection(c))
        return this.run(collection.propMap.get(property), collection, query, order, onStep)
    }

    /** init initializes this exporter to create a new page */
    protected abstract open(collection: ParsedMHDCollection, property: TMHDProperty): Promise<Accumulator | null>

    /** add adds the specified number of items from this page */
    protected abstract add(acc: Accumulator, values: Array<CodecType>, page_number: number): Promise<Accumulator>

    /** close generates a blob and releases all resources */
    protected abstract close(acc: Accumulator, aborted: boolean): Promise<Blob | null>


    // ====================
    // super Implementation
    // ====================
    protected initAcc(flags: TMHDProperty, collection: ParsedMHDCollection): Promise<Accumulator | null> {
        return this.open(collection, flags)
    }

    protected getPage(items: Array<TMHDItem<unknown>>, flags: TMHDProperty): Array<CodecType> {
        return items.map(item => item[flags.slug])
    }

    protected updateAcc(page: Array<CodecType>, index: number, acc: Accumulator, flags: TMHDProperty, collection: ParsedMHDCollection) {
        return this.add(acc, page, index)
    }

    protected getResult(acc: Accumulator, done: boolean, flags: TMHDProperty): Promise<Blob | null> {
        return this.close(acc, !done)
    }
}