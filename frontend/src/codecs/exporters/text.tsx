import type { ParsedMHDCollection } from "../../client/derived"
import type { TMHDProperty } from "../../client/rest"
import { CodecExporter } from "../../exporters"

/**
 * Exports any text with one text per line
 */
export class TextExporter extends CodecExporter<string>{
    readonly slug = "text"
    readonly displayName = "Plain Text"
    readonly defaultExtension = "txt"

    private lines = []

    protected async open(collection: ParsedMHDCollection, property: TMHDProperty, count: number, per_page: number): Promise<boolean> {
        this.lines = []
        return true
    }

    protected async add(values: Array<string>, page_number: number): Promise<boolean> {
        this.lines = this.lines.concat(values)
        return true
    }

    protected async close(aborted: boolean): Promise<Blob | undefined> {
        let blob: Blob | undefined = undefined
        if (!aborted) {
            blob = new Blob([this.lines.join("\n")], { type: "text/plain" })
        }
        this.lines = []
        return blob
    }
}