import BitStream from './BitStream';

it('can read from a fixed sized buffer', () => {
    const buf = new Uint8Array(128);
    const bitstream = new BitStream(buf, 12);
    bitstream.writeBits(12, 0xffff);
    bitstream.seekTo(0);
    

    expect(bitstream.bitsRemaining()).toBe(12);
    expect(bitstream.readBits(6)).toBe(63); // 111111

    expect(bitstream.bitsRemaining()).toBe(6);
    expect(bitstream.readBits(10)).toBe(63); // 111111
    
    expect(bitstream.bitsRemaining()).toBe(0);
});

it('can read from a variable sized buffer', () => {
    const buf = new Uint8Array(128);
    const bitstream = new BitStream(buf);
    bitstream.writeBits(12, 0xffff);
    bitstream.seekTo(0);
    

    expect(bitstream.bitsRemaining()).toBe(1024); // 8 * 128
    expect(bitstream.readBits(6)).toBe(63) // 111111

    expect(bitstream.bitsRemaining()).toBe(1018); // 8 * 128 - 6
    expect(bitstream.readBits(10)).toBe(1008); // 1111110000
    
    expect(bitstream.bitsRemaining()).toBe(1008);  // 8 * 128 - 12
});
