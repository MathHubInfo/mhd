import Sparse6toEdgeList from './Sparse6';

it('can decode vertexes', () => {
    expect(Sparse6toEdgeList(':Fa@x^')).toEqual({
        edges: [[0,1], [0,2], [1, 2], [5, 6]],
        nodes: 7,
    });
    expect(Sparse6toEdgeList(':CcKI')).toEqual({
        edges: [
            [ 0, 1 ], [ 0, 2 ],
            [ 1, 2 ], [ 0, 3 ],
            [ 1, 3 ], [ 2, 3 ],
        ],
        nodes: 4,
    });
    expect(Sparse6toEdgeList(':EgWI@M@J')).toEqual({
        edges: [
            [ 1, 2 ], [ 0, 3 ],
            [ 2, 3 ], [ 0, 4 ],
            [ 1, 4 ], [ 3, 4 ],
            [ 0, 5 ], [ 1, 5 ],
            [ 2, 5 ]
        ],
        nodes: 6
    });
})