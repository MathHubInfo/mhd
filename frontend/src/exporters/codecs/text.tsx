import type { ParsedMHDCollection } from "../../client/derived"
import type { TMHDProperty } from "../../client/rest"
import CodecExporter from "."

/* TextExporter exports string-based codecs as newline-delimited text */
export class TextExporter extends CodecExporter<string>{
    readonly slug = "text"
    readonly displayName = "Plain Text"
    readonly defaultExtension = "txt"

    protected async open(collection: ParsedMHDCollection, property: TMHDProperty): Promise<Array<string> | null> {
        return []
    }

    protected async add(acc: Array<string>, values: Array<string>, page_number: number): Promise<Array<string>> {
        return acc.concat(values)
    }

    protected async close(acc: Array<string>, aborted: boolean): Promise<Blob> {
        return new Blob([acc.join("\n")], { type: "text/plain" })
    }
}