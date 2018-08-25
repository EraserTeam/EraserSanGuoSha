import child_process = require('child_process');
export function* getRandomSequence(array: any[], randomFunction: (a: number, b: number) => number = random): IterableIterator<any> {
    let arr = array.slice();
    let end = arr.length - 1;
    for (let e of arr) {
        let n = randomFunction(0, end);
        yield arr[n];
        arr[n] = arr[end];
        end--;
    }
}
export function getRangeArr(a: number, b: number): number[] {
    if (a > b)
        [a, b] = [b, a];
    let arr: number[] = [];
    for (let i = a; i <= b; i++)
        arr.push(i);
    return arr;
}
export function random(a: number, b: number): number {
    if (a > b)
        [a, b] = [b, a];
    return Math.floor(Math.random() * (b - a + 1) + a);
}
export function timeout(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
export function removeRepeat(arr: any[]) {
    return [...new Set(arr.map((n: any) => +n))];
}
export function shuffle(arr: any[], randomFunction: (a: number, b: number) => number = random) {
    let array = arr.splice(0);
    let end = array.length - 1;
    array.forEach(() => {
        let n = randomFunction(0, end);
        arr.push(array[n]);
        array[n] = array[end];
        end--;
    });
    return arr;
}
export function sum(arr: number[]) {
    return arr.reduce((total, n) => total + n);
}
export function average(arr: number[]) {
    return sum(arr) / arr.length;
}
