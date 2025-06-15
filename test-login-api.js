// Test the login API to see if it's working properly
async function testLogin() {
    try {
        console.log('Testing login API...');
        
        const response = await fetch('http://localhost:3002/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },            body: JSON.stringify({
                email: 'kumaramartya11@gmail.com',
                password: 'password123' // You'll need to use the actual password
            })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.status === 200) {
            const data = await response.json();
            console.log('✅ Login API working - Response:', data);
        } else {
            const text = await response.text();
            console.log('❌ Login failed - Response text:', text);
            
            // Try to parse as JSON if possible
            try {
                const errorData = JSON.parse(text);
                console.log('Error data:', errorData);
            } catch (e) {
                console.log('Response is not JSON');
            }
        }
    } catch (error) {
        console.error('❌ Test failed with error:', error);
    }
}

testLogin();
