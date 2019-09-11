import BitStream from "./BitStream";

/**
 * Parses a Sparse6 encoded graph into an edge list.
 * @returns a list of pairs representing the edges of the graph, or undefined if there was an error in the format
*/
export default function Sparse6toEdgeList(chars: string): [number, number][] | undefined {
    if (chars.length === 0 || chars[0] !== ':') {
        return;
    }

    // create a new bitstream to hold the string of bits
    const buffer = new Uint8Array(8 * chars.length);
    const bitstream = new BitStream(buffer, 6 * (chars.length - 1));

    // write each bit into the bitstream
    // and bail out if it is not
    for( const c of chars.substring(1)) {
        const p = c.charCodeAt(0) - 63;
        if (p < 0 || p > 63) return undefined;
        bitstream.writeBits(6, p);
    }

    // reset the bitstream to the beginning
    bitstream.seekTo(0);

    // find the maximum vertex id
    const n = (() => {
        // if we have only one byte for the size, return it
        const firstByte = bitstream.readBits(6);
        if (firstByte < 63) return firstByte;

        // check if we have 18 bits for the size or 36
        const secondByte = bitstream.readBits(6);
        if (secondByte < 63) return (secondByte << 6) | bitstream.readBits(12)

        return bitstream.readBits(36);
    })();

    // bit size required for each vertex
    const vertexBitSize = Math.ceil(Math.log2(n - 1));

    // create a list of edges
    const edges: [number, number][] = [];

    // the current vertex number
    let currentVertex: number = 0;

    while(bitstream.bitsRemaining() > vertexBitSize) {
        const indicator = !!bitstream.readBits(1);

        // increase the current vertex if needed
        // and read the new vertex
        if(indicator) currentVertex += 1;

        // read the new vertex id
        const newVertex = bitstream.readBits(vertexBitSize);
        if(newVertex > n - 1) break;

        // if it is one we haven't encountered yet, we need to skip ahead to that vertex
        // in the counter
        if (newVertex > currentVertex) {
            currentVertex = newVertex;
        
        // if not, add an edge
        } else {
            edges.push([newVertex, currentVertex])
        }
    }
    return edges;
}