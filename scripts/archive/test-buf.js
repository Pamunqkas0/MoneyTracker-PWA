const b = new Uint8Array([1, 15, 255]);
const copy = new Uint8Array(b);
console.log(Array.prototype.map.call(copy, x => ('00' + x.toString(16)).slice(-2)).join(''));
