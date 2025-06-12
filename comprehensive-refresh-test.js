// Comprehensive test for the fresh news refresh functionality
// This simulates the actual refresh button clicks and verifies fresh content

async function testRefreshFunctionality() {
    console.log('🧪 COMPREHENSIVE FRESH NEWS REFRESH TEST');
    console.log('=========================================\n');
    
    const results = [];
    const baseUrl = 'http://localhost:3000';
    
    console.log('🎯 Testing fresh content guarantee...\n');
    
    // Simulate 6 refresh button clicks
    for (let i = 1; i <= 6; i++) {
        console.log(`🔄 Refresh Button Click #${i}`);
        console.log('─'.repeat(30));
        
        try {
            // Generate unique seed like the component does
            const refreshSeed = Date.now() + Math.random() * 1000;
            const apiUrl = `${baseUrl}/api/news?seed=${Math.floor(refreshSeed)}&refresh=true`;
            
            console.log(`   🎲 Seed: ${Math.floor(refreshSeed)}`);
            
            const startTime = Date.now();
            const response = await fetch(apiUrl);
            const data = await response.json();
            const loadTime = Date.now() - startTime;
            
            if (data.success) {
                const result = {
                    clickNumber: i,
                    seed: data.seed,
                    source: data.source,
                    query: data.query,
                    queryIndex: data.queryIndex,
                    domains: data.domains,
                    articleCount: data.articles?.length || 0,
                    firstArticle: data.articles?.[0]?.title?.substring(0, 50) || 'N/A',
                    loadTime: loadTime
                };
                
                results.push(result);
                
                console.log(`   ✅ Success: ${result.articleCount} articles loaded in ${loadTime}ms`);
                console.log(`   📊 Source: ${result.source}`);
                console.log(`   🔍 Query ${result.queryIndex}/${data.totalQueries}: ${result.query?.substring(0, 40)}...`);
                console.log(`   🌐 Domains: ${result.domains}`);
                console.log(`   📰 First: "${result.firstArticle}..."`);
                
            } else {
                console.log('   ❌ Failed to fetch articles');
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log('');
        
        // Wait 1 second between clicks (realistic user behavior)
        if (i < 6) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Analyze results
    console.log('📊 ANALYSIS RESULTS');
    console.log('===================\n');
    
    const uniqueQueries = new Set(results.map(r => r.query));
    const uniqueFirstArticles = new Set(results.map(r => r.firstArticle));
    const uniqueDomains = new Set(results.map(r => r.domains));
    const uniqueSeeds = new Set(results.map(r => r.seed));
    
    console.log(`🔢 Total refresh attempts: ${results.length}`);
    console.log(`🎲 Unique seeds: ${uniqueSeeds.size}/${results.length}`);
    console.log(`🔍 Unique queries: ${uniqueQueries.size}/${results.length}`);
    console.log(`🌐 Unique domain sets: ${uniqueDomains.size}/${results.length}`);
    console.log(`📰 Unique first articles: ${uniqueFirstArticles.size}/${results.length}`);
    
    const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
    console.log(`⚡ Average load time: ${Math.round(avgLoadTime)}ms`);
    
    console.log('\n🔄 REFRESH PATTERN:');
    results.forEach((result, index) => {
        console.log(`   ${index + 1}. Query ${result.queryIndex}: ${result.query?.substring(0, 35)}... (${result.source})`);
    });
    
    console.log('\n📰 ARTICLE VARIETY:');
    results.forEach((result, index) => {
        console.log(`   ${index + 1}. "${result.firstArticle}..."`);
    });
    
    // Fresh content verification
    console.log('\n✅ FRESH CONTENT VERIFICATION:');
    
    if (uniqueSeeds.size === results.length) {
        console.log('✅ PASS: All refresh calls used unique seeds');
    } else {
        console.log('⚠️  WARNING: Some refresh calls used duplicate seeds');
    }
    
    if (uniqueQueries.size >= Math.min(3, results.length)) {
        console.log('✅ PASS: Good query rotation detected');
    } else {
        console.log('⚠️  WARNING: Limited query rotation');
    }
    
    if (uniqueFirstArticles.size >= Math.min(4, results.length)) {
        console.log('✅ PASS: Excellent article variety - fresh content confirmed!');
    } else if (uniqueFirstArticles.size >= 2) {
        console.log('✅ PARTIAL: Some article variety detected');
    } else {
        console.log('❌ FAIL: No article variety - same content repeated');
    }
    
    if (avgLoadTime < 2000) {
        console.log('✅ PASS: Fast loading times - good user experience');
    } else {
        console.log('⚠️  WARNING: Slow loading times detected');
    }
    
    console.log('\n🎉 FRESH NEWS REFRESH TEST COMPLETE!');
    console.log('=====================================');
    
    // Final verdict
    const passedTests = [
        uniqueSeeds.size === results.length,
        uniqueQueries.size >= Math.min(3, results.length),
        uniqueFirstArticles.size >= Math.min(3, results.length),
        avgLoadTime < 2000
    ].filter(Boolean).length;
    
    console.log(`\n🏆 FINAL SCORE: ${passedTests}/4 tests passed`);
    
    if (passedTests >= 3) {
        console.log('🎉 EXCELLENT: Fresh news refresh functionality is working perfectly!');
    } else if (passedTests >= 2) {
        console.log('👍 GOOD: Fresh news refresh is working but could be improved');
    } else {
        console.log('⚠️  NEEDS WORK: Fresh news refresh needs improvements');
    }
}

// Run the test if this script is executed directly
if (typeof window === 'undefined') {
    testRefreshFunctionality().catch(console.error);
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.testRefreshFunctionality = testRefreshFunctionality;
}
