import type { TCollectionPredicate } from "../client"
import { MHDBackendClient } from "../client"
import type { ParsedMHDCollection } from "../client/derived"
import type { TMHDItem } from "../client/rest"

/** accumulate performs an async accumulation function */
async function accumulate<V, R>(
    start: () => Promise<{acc: V, total: number}>,
    step: (acc: V, index: number, progress: number) => Promise<{acc: V, done: boolean }>, 
    finalize: (acc: V, done: boolean) => Promise<R>,
): Promise<R> {
    let { acc, total } = await start()
    let index = 0
    let done = false
    let result: R
    try {
        while(!done) {
            ({ done, acc } = await step(acc, index, index / total))
            index++
        }
    } finally {
        result = await finalize(acc, done)
    }
    return result
}

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
        const [ collection, total ] = await Promise.all([
            collectionPromise,
            client.fetchItemCount({ slug }, query),
        ])
        
        return accumulate<Accumulator, Result>(
            async () => {
                if(!onStep(0)) return null
                return { acc: await this.initAcc(flags, collection), total: Math.ceil(total / this.PER_PAGE) }
            },
            async (acc: Accumulator, index: number, progress: number) => {
                if (!onStep(progress)) {
                    throw new Error("User asked to cancel")
                }
                
                const { results: items, next } = await client.fetchItems<unknown>(collection, collection.propertySlugs, query, order, index + 1, this.PER_PAGE)
                const page = this.getPage(items, flags)
                
                acc = await this.updateAcc(page, index, acc, flags, collection)
                return { acc, done: !next }
            },
            async (acc: Accumulator, done: boolean) => {
                const result = await this.getResult(acc, done, flags)
                if (result === null) throw new Error("getResult returned null")
                if (done) {
                    onStep(1)
                }
                return result
            }
        )
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
