import type { TCollectionPredicate } from "../../client"
import type { ParsedMHDCollection } from "../../client/derived"
import type { TMHDItem } from "../../client/rest"
import { ClientSideExporter } from "../index"

/** A CollectionExporter represents an exporter for an entire collection */
export default abstract class CollectionExporter<Accumulator> extends ClientSideExporter<null, Accumulator, Blob> {

    /** export is a convenience function to export the given collection */
    async export(slug: string, query: TCollectionPredicate, order: string, onStep: (progress: number) => boolean): Promise<Blob> {
        return this.run(null, slug, query, order, onStep)
    }

    /** init initializes this exporter to create a new page */
    protected abstract open(collection: ParsedMHDCollection): Promise<Accumulator | null>

    /** add adds the specified number of items from this page */
    protected abstract add(acc: Accumulator, items: TMHDItem<unknown>[], page_number: number): Promise<Accumulator | null>

    /** close generates a blob and releases all resources */
    protected abstract close(acc: Accumulator, aborted: boolean): Promise<Blob | null>


    // ====================
    // super Implementation
    // ====================

    protected initAcc(flags: null, collection: ParsedMHDCollection): Promise<Accumulator | null> {
        return this.open(collection)
    }

    protected getPage(items: Array<TMHDItem<unknown>>, flags: null): Array<TMHDItem<unknown>> {
        return items
    }

    protected updateAcc(page: Array<TMHDItem<unknown>>, index: number, acc: Accumulator, flags: null, collection: ParsedMHDCollection) {
        return this.add(acc, page, index)
    }

    protected getResult(acc: Accumulator, done: boolean, flags: null): Promise<Blob | null> {
        return this.close(acc, !done)
    }
}
