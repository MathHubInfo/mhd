import type { TCollectionPredicate } from "../client"
import type { MHDBackendClient } from "../client"
import type { ParsedMHDCollection } from "../client/derived"
import type { TMHDItem, TMHDProperty } from "../client/rest"

/** A CollectionExporter represents an exporter for an entire collection */
export abstract class CollectionExporter<T> {
    abstract readonly slug: string
    abstract readonly displayName: string
    abstract readonly defaultExtension: string

    /** hashExport hashes parameter for an export */
    hashExport(slug: string, query: TCollectionPredicate): string {
        const hash = {
            exporter: this.slug,
            slug: slug,
            filters: query.filters,
            pre_filter: query.pre_filter,
        }
        return JSON.stringify(hash)
    }

    private running = false

    /** exports the given collection into a blob */
    async export(client: MHDBackendClient, slug: string, query: TCollectionPredicate, order: string, onStep: (progress: number) => boolean): Promise<Blob> {
        if (this.running) throw new Error("Exporter already running")
        this.running = true

        // grab the collection
        const collection = client.parseCollection(await client.fetchCollection(slug))

        // compute the total number of items
        const per_page = 100
        const total = await client.fetchItemCount(collection, query)
        const total_pages = Math.ceil(total / per_page)

        // start the exporter
        const open = await this.open(collection, total, per_page)
        if (!open) throw new Error("exporter.open returned false")

        try {
            // iterate over the pages
            // TODO: Update a progress bar?
            let index = 1
            while(true) {
                if (!onStep(index / total_pages)) {
                    throw new Error("User asked to cancel")
                }
    
                const page = await client.fetchItems<T>(collection, collection.propertySlugs, query, order, index, per_page)
                this.add(page.results, index)
                
                // if we have more pages, go to the next page
                if(!page.next) break
                index++
            }

            // and finalize the exporter
            onStep(1)

            const result = await this.close(false)
            this.running = false
            return result 
        } catch(e) {
            // something went wrong: close all resources
            this.close(true)
            this.running = false
            throw e
        }
    }

    /** init initializes this exporter to create a new page */
    protected abstract open(collection: ParsedMHDCollection, count: number, per_page: number): Promise<boolean>

    /** add adds the specified number of items from this page */
    protected abstract add(items: TMHDItem<T>[], page_number: number): Promise<boolean>

    /** close generates a blob and releases all resources */
    protected abstract close(aborted: boolean): Promise<Blob | undefined>
}


/** A CodecExporter represents an exporter for a specific codec */
export abstract class CodecExporter<T> {
    abstract readonly slug: string
    abstract readonly displayName: string
    abstract readonly defaultExtension: string

    /** hashExport hashes parameter for an export */
    hashExport(slug: string, prop: string, query: TCollectionPredicate): string {
        const hash = {
            exporter: this.slug,
            slug: slug,
            prop: prop,
            filters: query.filters,
            pre_filter: query.pre_filter,
        }
        return JSON.stringify(hash)
    }

    private running = false

    /** exports the given collection into a blob */
    async export(client: MHDBackendClient, slug: string, prop: string, query: TCollectionPredicate, order: string, onStep: (progress: number) => boolean): Promise<Blob> {
        if (this.running) throw new Error("Exporter already running")
        this.running = true

        // grab the collection
        const collection = client.parseCollection(await client.fetchCollection(slug))
        const property = collection.propMap.get(prop)
        console.log(collection, prop, property)
        if (!property) throw new Error("property not found")

        // compute the total number of items
        const per_page = 100
        const total = await client.fetchItemCount(collection, query)
        const total_pages = Math.ceil(total / per_page)

        // start the exporter
        const open = await this.open(collection, property, total, per_page)
        if (!open) throw new Error("exporter.open returned false")

        try {
            // iterate over the pages
            // TODO: Update a progress bar?
            let index = 1
            while(true) {
                if (!onStep(index / total_pages)) {
                    throw new Error("User asked to cancel")
                }
    
                const page = await client.fetchItems<T>(collection, [prop], query, order, index, per_page)
                this.add(page.results.map(value => value[prop]), index)
                
                // if we have more pages, go to the next page
                if(!page.next) break
                index++
            }

            // and finalize the exporter
            onStep(1)

            const result = await this.close(false)
            this.running = false
            return result 
        } catch(e) {
            // something went wrong: close all resources
            this.close(true)
            this.running = false
            throw e
        }
    }

    /** init initializes this exporter to create a new page */
    protected abstract open(collection: ParsedMHDCollection, property: TMHDProperty, count: number, per_page: number): Promise<boolean>

    /** add adds the specified number of items from this page */
    protected abstract add(values: Array<T>, page_number: number): Promise<boolean>

    /** close generates a blob and releases all resources */
    protected abstract close(aborted: boolean): Promise<Blob | undefined>
}