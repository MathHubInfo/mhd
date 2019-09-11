import Sparse6toEdgeList from './Sparse6';

it('can decode vertexes', () => {
    expect(Sparse6toEdgeList(':Fa@x^')).toEqual([
        [0,1], [0,2], [1, 2], [5, 6],
    ]);
    expect(Sparse6toEdgeList(':CcKI')).toEqual([
        [ 0, 1 ], [ 0, 2 ],
        [ 1, 2 ], [ 0, 3 ],
        [ 1, 3 ], [ 2, 3 ],
    ]);
    expect(Sparse6toEdgeList(':EgWI@M@J')).toEqual([
        [ 1, 2 ], [ 0, 3 ],
        [ 2, 3 ], [ 0, 4 ],
        [ 1, 4 ], [ 3, 4 ],
        [ 0, 5 ], [ 1, 5 ],
        [ 2, 5 ]
    ]);
})