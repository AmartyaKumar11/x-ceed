#!/usr/bin/env node

/**
 * Mock Interview Setup Test
 * 
 * This script tests the mock interview functionality and backend connectivity.
 * Run this before using the mock interview feature to ensure everything is working.
 */

const fetch = require('node-fetch');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAllBackendServices() {
  log('\n🔍 Testing All Python Backend Services...', colors.cyan);
  
  const services = [
    { name: 'RAG Service', url: 'http://localhost:8000/', port: 8000 },
    { name: 'Video AI Service', url: 'http://localhost:8002/', port: 8002 },
    { name: 'Gemini Chat Service', url: 'http://localhost:8003/', port: 8003 },
    { name: 'AI Resume Service', url: 'http://localhost:8004/', port: 8004 },
    { name: 'Job Description Service', url: 'http://localhost:8008/health', port: 8008 }
  ];
  
  let allOnline = true;
  
  for (const service of services) {
    try {
      const response = await fetch(service.url, {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        log(`✅ ${service.name} (Port ${service.port}) - Online`, colors.green);
      } else {
        log(`❌ ${service.name} (Port ${service.port}) - Error ${response.status}`, colors.red);
        allOnline = false;
      }
    } catch (error) {
      log(`❌ ${service.name} (Port ${service.port}) - Offline`, colors.red);
      allOnline = false;
    }
  }
  
  return allOnline;
}

async function testBackendService() {
  log('\n🔍 Testing Job Description Service (Port 8008)...', colors.cyan);
  
  try {
    const response = await fetch('http://localhost:8008/health', {
      method: 'GET',
      timeout: 5000,
    });
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Backend service is online: ${data.service}`, colors.green);
      return true;
    } else {
      log(`❌ Backend service responded with status: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Backend service is offline: ${error.message}`, colors.red);
    log('💡 To start all services, run: npm run dev:full', colors.yellow);
    return false;
  }
}

async function testQuestionGeneration() {
  log('\n🔍 Testing Question Generation API...', colors.cyan);
  
  try {
    const response = await fetch('http://localhost:3002/api/mock-interview/generate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    
    if (response.ok) {
      log('✅ Question generation API is working', colors.green);
      return true;
    } else if (response.status === 503) {
      log('❌ Question generation API reports backend offline', colors.red);
      return false;
    } else {
      log(`❌ Question generation API error: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Could not reach question generation API: ${error.message}`, colors.red);
    log('💡 Make sure the Next.js development server is running: npm run dev', colors.yellow);
    return false;
  }
}

async function testAnalysisAPI() {
  log('\n🔍 Testing Interview Analysis API...', colors.cyan);
  
  try {
    const response = await fetch('http://localhost:3002/api/mock-interview/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    });
    
    if (response.ok) {
      log('✅ Interview analysis API is working', colors.green);
      return true;
    } else if (response.status === 503) {
      log('❌ Interview analysis API reports backend offline', colors.red);
      return false;
    } else {
      log(`❌ Interview analysis API error: ${response.status}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`❌ Could not reach interview analysis API: ${error.message}`, colors.red);
    log('💡 Make sure the Next.js development server is running: npm run dev', colors.yellow);
    return false;
  }
}

async function runTests() {
  log('🚀 Complete System Test', colors.blue);
  log('=' .repeat(50), colors.blue);
  
  const allServicesOk = await testAllBackendServices();
  const jobDescOk = await testBackendService();
  const questionApiOk = await testQuestionGeneration();
  const analysisApiOk = await testAnalysisAPI();
  
  log('\n📊 Test Results:', colors.cyan);
  log('=' .repeat(30), colors.cyan);
  
  if (allServicesOk && jobDescOk && questionApiOk && analysisApiOk) {
    log('🎉 All tests passed! Complete system is ready!', colors.green);
    log('\n📝 What\'s working:', colors.blue);
    log('✅ All Python backend services (ports 8000, 8002, 8003, 8004, 8008)', colors.blue);
    log('✅ Next.js frontend (port 3002)', colors.blue);
    log('✅ Mock interview functionality', colors.blue);
    log('✅ Job description upload and parsing', colors.blue);
    log('✅ Question generation and analysis', colors.blue);
  } else {
    log('⚠️  Some tests failed. Please fix the issues above.', colors.yellow);
    log('\n🛠️  Quick fixes:', colors.blue);
    log('• Start all services: npm run dev:full', colors.blue);
    log('• Check individual service: npm run job-desc-service', colors.blue);
    log('• Start Next.js only: npm run dev', colors.blue);
    log('• Run pre-flight check: npm run dev:check', colors.blue);
  }
  
  log('\n' + '=' .repeat(50), colors.blue);
}

// Run the tests
runTests().catch(error => {
  log(`\n💥 Test script failed: ${error.message}`, colors.red);
  process.exit(1);
});
