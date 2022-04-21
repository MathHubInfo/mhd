/**
 * A BitStream class. 
 * Adapted from https://gist.github.com/claus/2829664.
 */
export default class BitStream {
    /**
     * @param buffer uint8array to store data in
     * @param maxSize Maximum number of elements with meaningful data
     */
    constructor(public readonly buffer: Uint8Array, length?: number) {
        this.length = length !== undefined ? length : 8 * buffer.length
    }

    private bitsPending = 0
    private position = 0
    readonly length: number

    /**
     * 
     * @param bits Number of bits to write
     * @param value Number representing bits to write
     */
    writeBits(bits: number, value: number) {
		if (bits === 0) { return }
		value &= (0xffffffff >>> (32 - bits))
		let bitsConsumed: number
		if (this.bitsPending > 0) {
			if (this.bitsPending > bits) {
				this.buffer[this.position - 1] |= value << (this.bitsPending - bits)
				bitsConsumed = bits
				this.bitsPending -= bits
			} else if (this.bitsPending === bits) {
				this.buffer[this.position - 1] |= value
				bitsConsumed = bits
				this.bitsPending = 0
			} else {
				this.buffer[this.position - 1] |= value >> (bits - this.bitsPending)
				bitsConsumed = this.bitsPending
				this.bitsPending = 0
			}
		} else {
			bitsConsumed = Math.min(8, bits)
			this.bitsPending = 8 - bitsConsumed
			this.buffer[this.position++] = (value >> (bits - bitsConsumed)) << this.bitsPending
		}
		bits -= bitsConsumed
		if (bits > 0) {
			this.writeBits(bits, value)
		}
    }
    
    /**
     * Reads bits from this buffer
     * @param bits number of bits to read
     * @param bitBuffer for internal use only
     */
    readBits(bits: number, bitBuffer?: number): number {
		if (bitBuffer === undefined) { bitBuffer = 0 }
        if (bits === 0) { return bitBuffer }
        if (bits > this.bitsRemaining()) { bits = this.bitsRemaining() }
		let partial: number
		let bitsConsumed: number
		if (this.bitsPending > 0) {
			const byte = this.buffer[this.position - 1] & (0xff >> (8 - this.bitsPending))
			bitsConsumed = Math.min(this.bitsPending, bits)
			this.bitsPending -= bitsConsumed
			partial = byte >> this.bitsPending
		} else {
			bitsConsumed = Math.min(8, bits)
			this.bitsPending = 8 - bitsConsumed
			partial = this.buffer[this.position++] >> this.bitsPending
		}
		bits -= bitsConsumed
		bitBuffer = (bitBuffer << bitsConsumed) | partial
		return (bits > 0) ? this.readBits(bits, bitBuffer) : bitBuffer
    }
    
    /** seeks this bit stream to the given position */
    seekTo(bitPos: number) {
		this.position = (bitPos / 8) | 0
		this.bitsPending = bitPos % 8
		if(this.bitsPending > 0) {
			this.bitsPending = 8 - this.bitsPending
			this.position++
		}
    }
    
    /** returns the remaining bits to be read */
    bitsRemaining(): number {
        return this.bitsPending + this.length - (this.position*8)
    }
}
