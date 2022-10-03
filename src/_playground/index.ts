const encoder = new TextEncoder();
const decoder = new TextDecoder();
const buffer = new SharedArrayBuffer(1e6);
const array = new Uint8Array(buffer);

const read = (arr: Uint8Array) => {
    return decoder.decode(arr);
};

const write = (arr: Uint8Array, newValue: any) => {
    const data = typeof newValue !== 'string' ? JSON.stringify(newValue) : newValue;
    const buffer = Buffer.from(data, 'utf-8');

    // HEY! this can be done in a single loop. Loop through the entire item's bytes, detect differences.
    // if they are different, then replace. You'll have to loop through the entire item to get the ranges
    // anyways, so better to just go with that solution.
    // todo: Create an array of ranges where the data is different between two points,
    // todo: then only rewrite the data at those points. Heavily increases performance.
    // todo: Can be done recursively.
    const offset = arr.findIndex((value, index) => buffer.at(index) !== value);

    for (let i = offset; i <= buffer.byteLength; i++) {
        Atomics.store(arr, i, buffer[i]);
    }
};

write(array, { hello: 'world' });

console.log(read(array));
write(array, { hello: 'world', hey: '123' });
console.log(read(array));
