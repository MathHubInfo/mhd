import { CollectionExporter } from "."
import type { ParsedMHDCollection } from "../client/derived"
import type { TMHDItem } from "../client/rest"

export class JSONExporter<T> extends CollectionExporter<T> {
    readonly slug = "json"
    readonly displayName = "JSON"
    readonly defaultExtension = "json"

    private exportAry: Array<TMHDItem<T>> = []
    
    async open(collection: ParsedMHDCollection, total: number, per_page: number): Promise<boolean> {
        this.exportAry = []
        return true
    }

    async add(items: TMHDItem<T>[], page_number: number): Promise<boolean> {
        items.forEach(item => this.exportAry.push(item))
        return true
    }

    async close(aborted: boolean): Promise<Blob | undefined> {
        let blob: Blob | undefined
        if (!aborted) {
            blob = new Blob(
                [JSON.stringify(this.exportAry)],
                { type: "application/json" },
            )
        }
        
        this.exportAry = []
        return blob
    }
}