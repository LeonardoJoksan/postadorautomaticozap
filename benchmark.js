
const mockN = {
    a: () => {}
};
const mockK = {
    a: () => {}
};

let fetchCount = 0;
const originalFetch = async (url, options) => {
    fetchCount++;
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
        status: 200,
        url: url,
        json: async () => ({ status: "success", query: "1.2.3.4" })
    };
};

global.fetch = originalFetch;

async function I_baseline(n, k){
    const t=Date.now(),e="http://ip-api.com/json",r={};
    try{
        let d=await fetch(e,{method:"GET"}).then(t=>(200!==t.status&&Object(n["a"])({eventType:920014,otherParams:{url:t.url,status:t.status}}),t.json()));
        return Object(k["a"])(e,r,d,t,!0),d
    }catch(d){
        Object(k["a"])(e,r,{error:(null===d||void 0===d?void 0:d.message)||String(d)},t,!1)
    }
}

// Optimized version to be implemented
var _ipCache = null;
async function I_optimized(n, k){
    if (_ipCache) return _ipCache;
    const t=Date.now(),e="http://ip-api.com/json",r={};
    _ipCache = fetch(e,{method:"GET"}).then(t=>(200!==t.status&&Object(n["a"])({eventType:920014,otherParams:{url:t.url,status:t.status}}),t.json()))
    .then(d => {
        Object(k["a"])(e,r,d,t,!0);
        return d;
    })
    .catch(d => {
        _ipCache = null; // Reset cache on error to allow retry
        Object(k["a"])(e,r,{error:(null===d||void 0===d?void 0:d.message)||String(d)},t,!1);
        throw d;
    });
    return _ipCache;
}

async function runBenchmark(fn, name) {
    fetchCount = 0;
    console.log(`\nRunning ${name}...`);
    const start = Date.now();
    
    // Simulate 5 concurrent calls
    const results = await Promise.all([
        fn(mockN, mockK),
        fn(mockN, mockK),
        fn(mockN, mockK),
        fn(mockN, mockK),
        fn(mockN, mockK)
    ]);
    
    const end = Date.now();
    console.log(`${name} Results:`);
    console.log(`- Time: ${end - start}ms`);
    console.log(`- Fetch calls: ${fetchCount}`);
    const success = results.length === 5 && results.every(r => r && r.query === "1.2.3.4");
    console.log(`- Success: ${success}`);
    return { time: end - start, fetchCalls: fetchCount };
}

(async () => {
    const baseline = await runBenchmark(I_baseline, "Baseline (No Caching)");
    const optimized = await runBenchmark(I_optimized, "Optimized (With Caching)");
    
    console.log("\nSummary:");
    console.log(`- Reduction in fetch calls: ${baseline.fetchCalls - optimized.fetchCalls}`);
    console.log(`- Performance improvement: ${baseline.time - optimized.time}ms (${((baseline.time - optimized.time) / baseline.time * 100).toFixed(2)}%)`);
})();
