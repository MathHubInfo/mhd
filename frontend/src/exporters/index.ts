import type { TCollectionPredicate } from "../client"
import { MHDBackendClient } from "../client"
import type { ParsedMHDCollection } from "../client/derived"
import type { TMHDItem } from "../client/rest"

export abstract class ClientSideExporter<Flags, Accumulator, Result, Page = Array<TMHDItem<unknown>>> {
    abstract readonly slug: string
    abstract readonly displayName: string
    abstract readonly defaultExtension: string

    /** initAcc initializes the accumulator */
    protected abstract initAcc(flags: Flags, collection: ParsedMHDCollection): Promise<Accumulator | null>

    /** getPage gets the page for a set of items */
    protected abstract getPage(items: Array<TMHDItem<unknown>>, flags: Flags): Page

    /** updateAcc updates the accumulator for a given state */
    protected abstract updateAcc(page: Page, index: number, acc: Accumulator, flags: Flags, collection: ParsedMHDCollection): Promise<Accumulator | null>

    /** finalizeAcc finalizes the accumulator */
    protected abstract getResult(acc: Accumulator, done: boolean, flags: Flags): Promise<Result | null>

    protected readonly PER_PAGE = 1000

    /** run runs this ClientSideExporter */
    async run(flags: Flags, slug_or_collection: string | ParsedMHDCollection, query: TCollectionPredicate, order: string, onStep: (progress: number) => boolean): Promise<Result> {
        const client = MHDBackendClient.getInstance()

        // make a promise for the entire collection
        const slug = typeof slug_or_collection === "string" ? slug_or_collection : slug_or_collection.slug
        const collectionPromise = typeof slug_or_collection === "string" ?
            client.fetchCollection(slug_or_collection).then(c => client.parseCollection(c)) :
            Promise.resolve(slug_or_collection)

        // fetch the entire collection and count
        const [ collection, count ] = await Promise.all([
            collectionPromise,
            client.fetchItemCount({ slug }, query),
        ])

        const total = count / this.PER_PAGE
        let acc = await this.initAcc(flags, collection)

        let index = 0
        let done = false
        let result: Result
        try {
            while(!done) {
                const progress = index / total
                if (!onStep(progress)) {
                    throw new Error("User asked to cancel")
                }

                const { results, next } = await client.fetchItems<unknown>(
                    collection,
                    collection.propertySlugs,
                    query,
                    order,
                    index + 1, // indexes in fetchItems are 1-based!
                    this.PER_PAGE,
                )
                const page = this.getPage(results, flags)
                
                acc = await this.updateAcc(page, index, acc, flags, collection)
                done = !next
                index++
            }
        } finally {
            result = await this.getResult(acc, done, flags)
            if (done) {
                onStep(1)
            }
        }
        return result
    }

    /** hashRun hashes the parameters of the run function */
    hashRun(flags: Flags, slug: string, query: TCollectionPredicate, order: string): string {
        return JSON.stringify({
            flags: flags,
            slug: slug,
            query: query,
            order: order,
        })
    }
}
