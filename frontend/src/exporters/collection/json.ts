import CollectionExporter from "."
import type { ParsedMHDCollection } from "../../client/derived"
import type { TMHDItem } from "../../client/rest"

export class JSONExporter<T> extends CollectionExporter<Array<TMHDItem<T>>> {
    readonly slug = "json"
    readonly displayName = "JSON"
    readonly defaultExtension = "json"
    
    async open(collection: ParsedMHDCollection): Promise<Array<TMHDItem<T>> | null> {
        return []
    }

    async add(acc: TMHDItem<T>[], items: TMHDItem<T>[], page_number: number): Promise<Array<TMHDItem<T>>> {
        return acc.concat(items)
    }

    async close(acc: TMHDItem<T>[], aborted: boolean): Promise<Blob | undefined> {
        let blob: Blob | undefined
        if (!aborted) {
            blob = new Blob(
                [JSON.stringify(acc)],
                { type: "application/json" },
            )
        }
        return blob
    }
}