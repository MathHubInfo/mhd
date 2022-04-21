/**
 * Splits an array into chunks of size chunkSize
 * @param arr 
 * @param chunkSize 
 */
export function chunkArray<T>(arr: T[], chunkSize: number): T[][]{
    const chunks: T[][] = []
    for (let index = 0; index < arr.length; index += chunkSize) {
        chunks.push(arr.slice(index, index+chunkSize))
    }
    return chunks
}
