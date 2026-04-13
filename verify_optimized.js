
const mockN = {
    a: (params) => {
        // console.log("n.a called with:", params);
    }
};
const mockK = {
    a: (url, r, data, t, success) => {
        // console.log(`k.a called with success=${success}`);
    }
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

const errorFetch = async (url, options) => {
    fetchCount++;
    throw new Error("Network Error");
};

global.fetch = originalFetch;

// The optimized function from background.js
var _ipCache = null;
async function I(n, k){
    if(_ipCache)return _ipCache;
    const t=Date.now(),e="http://ip-api.com/json",r={};
    return _ipCache=fetch(e,{method:"GET"}).then(t=>(200!==t.status&&Object(n["a"])({eventType:920014,otherParams:{url:t.url,status:t.status}}),t.json())).then(d=>(Object(k["a"])(e,r,d,t,!0),d)).catch(d=>(_ipCache=null,Object(k["a"])(e,r,{error:(null===d||void 0===d?void 0:d.message)||String(d)},t,!1))) 
}

async function runBenchmark(fn, name) {
    _ipCache = null;
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

async function testErrorAndRetry() {
    _ipCache = null;
    fetchCount = 0;
    console.log("\nTesting Error and Retry...");
    
    global.fetch = errorFetch;
    try {
        await I(mockN, mockK);
    } catch (e) {
        // console.log("First call failed as expected");
    }
    
    global.fetch = originalFetch;
    const result = await I(mockN, mockK);
    console.log("- Retry after error success:", result && result.query === "1.2.3.4");
    console.log("- Total fetch calls (1 error + 1 success):", fetchCount);
}

(async () => {
    await runBenchmark(I, "Optimized Caching (Concurrent)");
    
    // Sequential test
    fetchCount = 0;
    await I(mockN, mockK);
    await I(mockN, mockK);
    console.log("\nOptimized Caching (Sequential) Results:");
    console.log("- Total fetch calls after 2 sequential calls:", fetchCount);

    await testErrorAndRetry();
})();
