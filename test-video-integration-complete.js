// Complete integration test for the video dialog feature
const puppeteer = require('puppeteer');

async function testVideoIntegration() {
    console.log('🎬 Testing Complete Video Integration...');
    
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        
        // Test API endpoints first
        console.log('\n🔧 Testing API Endpoints...');
        
        // Test different skill queries
        const testSkills = ['javascript', 'react', 'python', 'nodejs', 'aws'];
        
        for (const skill of testSkills) {
            try {
                const response = await page.goto(`http://localhost:3000/api/youtube/videos?search=${skill}`);
                const data = await response.json();
                
                console.log(`✅ ${skill.toUpperCase()}: ${data.videos?.length || 0} videos returned`);
                
                if (data.videos && data.videos.length > 0) {
                    const firstVideo = data.videos[0];
                    console.log(`   - Sample: "${firstVideo.title.substring(0, 50)}..."`);
                    console.log(`   - Thumbnail: ${firstVideo.thumbnail ? '✅' : '❌'}`);
                    console.log(`   - Channel: ${firstVideo.channel}`);
                }
            } catch (error) {
                console.log(`❌ ${skill.toUpperCase()}: API Error - ${error.message}`);
            }
        }
        
        console.log('\n🌐 Testing Frontend Integration...');
        
        // Create a mock job for testing
        const mockJob = {
            id: 'test-job-1',
            title: 'Full Stack Developer',
            companyName: 'Tech Corp',
            description: `We are looking for a Full Stack Developer with expertise in:
            - JavaScript and modern frameworks like React
            - Backend development with Node.js
            - Python for data processing
            - AWS cloud services
            - Database management`,
            location: 'Remote',
            salary: '$80,000 - $120,000'
        };
        
        const jobParam = encodeURIComponent(JSON.stringify(mockJob));
        const prepPlanUrl = `http://localhost:3000/dashboard/applicant/prep-plan?job=${jobParam}`;
        
        console.log('🔄 Navigating to prep plan page...');
        await page.goto(prepPlanUrl, { waitUntil: 'networkidle2' });
        
        // Wait for the page to load and generate the prep plan
        console.log('⏳ Waiting for prep plan to generate...');
        await page.waitForSelector('.space-y-6', { timeout: 30000 });
        
        // Look for skill cards and video buttons
        console.log('🔍 Looking for skill cards and video buttons...');
        const videoButtons = await page.$$('button[class*="text-red-600"]:has-text("View Related Videos")');
        
        if (videoButtons.length > 0) {
            console.log(`✅ Found ${videoButtons.length} "View Related Videos" buttons`);
            
            // Click the first video button
            console.log('🎬 Testing video dialog...');
            await videoButtons[0].click();
            
            // Wait for dialog to open
            await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
            console.log('✅ Video dialog opened successfully');
            
            // Wait for videos to load
            await page.waitForSelector('.grid', { timeout: 15000 });
            console.log('✅ Video grid loaded');
            
            // Count video cards
            const videoCards = await page.$$('.grid > div');
            console.log(`✅ Found ${videoCards.length} video cards in the dialog`);
            
            // Test clicking on a video
            if (videoCards.length > 0) {
                console.log('🎥 Testing video player...');
                await videoCards[0].click();
                
                // Wait for iframe to load
                await page.waitForSelector('iframe[src*="youtube.com/embed"]', { timeout: 10000 });
                console.log('✅ YouTube player loaded successfully');
                
                // Test back button
                const backButton = await page.$('button:has-text("← Back to Videos")');
                if (backButton) {
                    await backButton.click();
                    console.log('✅ Back to videos functionality works');
                }
            }
            
            // Close dialog
            const closeButton = await page.$('[role="dialog"] button[aria-label="Close"]') || 
                              await page.$('[role="dialog"] [data-state="open"] button');
            if (closeButton) {
                await closeButton.click();
                console.log('✅ Dialog closed successfully');
            }
            
        } else {
            console.log('❌ No "View Related Videos" buttons found');
        }
        
        console.log('\n🎉 Integration test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
testVideoIntegration().catch(console.error);
