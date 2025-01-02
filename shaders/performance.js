export function measurePerformance(func) {
    var start = performance.now();
    func();
    var end = performance.now();
    console.log("Time taken: " + (end - start) + "ms");
}
