import { Exporter } from "."
import type { ParsedMHDCollection } from "../client/derived"
import type { TMHDItem } from "../client/rest"

// TODO: To use, see frontend/src/pages/collection/[slug]/index.tsx:119
export class SageCVTExporter<T> extends Exporter<T> {
    readonly slug = "sage-cvt"
    readonly displayName = "Sage"
    readonly defaultExtension = "json"

    private text: string

    async open(collection: ParsedMHDCollection, total: number, per_page: number): Promise<boolean> {
        this.text = ""
        return true
    }

    async add(items: TMHDItem<T>[], page_number: number): Promise<boolean> {
        items.forEach(item => this.text += "\n" + JSON.stringify(item))
        return true
    }

    async close(aborted: boolean): Promise<Blob | undefined> {
        if (aborted) {
            this.text = ""
            return
        }

        
        const blob = new Blob(
            [this.text],
            { type: "application/json" },
        )
        this.text = ""
        return blob
    }
}