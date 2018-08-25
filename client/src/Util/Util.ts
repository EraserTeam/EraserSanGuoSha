class Util {
    public static timeout(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    public static random(a: number, b: number): number {
        if (a > b)
            [a, b] = [b, a];
        return Math.floor(Math.random() * (b - a + 1) + a);
    }
}