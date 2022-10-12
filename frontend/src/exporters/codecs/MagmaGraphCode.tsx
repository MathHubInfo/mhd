import type { ParsedMHDCollection } from "../../client/derived"
import type { TMHDProperty } from "../../client/rest"
import CodecExporter from "."

/* MagmaGraphCodeExporter exports magam */
export class MagmaGraphCodeExporter extends CodecExporter<string>{
    readonly slug = "magma-graph-code"
    readonly displayName = "Magma Code"
    readonly defaultExtension = "mag"

    protected async open(collection: ParsedMHDCollection, property: TMHDProperty): Promise<Array<string> | null> {
        return []
    }

    protected async add(acc: Array<string>, values: Array<string>, page_number: number): Promise<Array<string>> {
        return acc.concat(values.map(v => {
            const values = v.split(":=").slice(1).join(":=")
            if (values.endsWith(";")) {
                return values.substring(0, values.length - 1)
            }
            return values
        }))
    }

    protected async close(acc: Array<string>, aborted: boolean): Promise<Blob> {
        const pre = "    "
        const sep = ","
        return new Blob(["export := [\n" + pre + acc.join(sep + "\n" + pre) + "\n];"], { type: "text/plain" })
    }
}