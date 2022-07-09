import type { PageState } from "./state"
import { encodeState, decodeState } from "./state"

const states: PageState[] = [
    { filters: [], columns: ["test"], widths: undefined, page: 1, per_page: 20, order: "stuff" },
]

it("encode and decode specific states", () => {
    states.forEach(s => {
        const jsonBefore = JSON.stringify(s)
        const jsonAfter = JSON.stringify(decodeState(encodeState(s)))
        expect(jsonAfter).toBe(jsonBefore)
    })
})
