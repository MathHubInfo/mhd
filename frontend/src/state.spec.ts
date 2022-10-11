import type { PageState } from "./state"
import { encodeState, decodeState } from "./state"

const states: PageState[] = [
    { query: { filters: [] }, columns: ["test"], widths: undefined, page: 1, per_page: 20, order: "stuff" },
]

it("encode and decode specific states", () => {
    states.forEach(s => {
        expect(s).toStrictEqual(decodeState(encodeState(s)))
    })
})
