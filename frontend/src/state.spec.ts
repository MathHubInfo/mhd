import {encodeState, decodeState, MHDCollectionSearchState} from './state';

const states: MHDCollectionSearchState[] = [
    {filters: [], columns: ["test"], widths: undefined, page: 1, per_page: 20}
];

it('encode and decode specific states', () => {
    states.forEach(s => {
        const jsonBefore = JSON.stringify(s);
        const jsonAfter = JSON.stringify(decodeState(encodeState(s)));
        expect(jsonAfter).toBe(jsonBefore);
    })
});
