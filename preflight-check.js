#!/usr/bin/env node

/**
 * Pre-flight Check for dev:full command
 * 
 * This script validates that all Python services and dependencies are ready
 * before starting the full development environment.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

// Python services configuration
const services = [
  {
    name: 'RAG Service',
    file: 'services/python/simplified_rag_service.py',
    port: 8000,
    command: 'npm run python'
  },
  {
    name: 'Video AI Service',
    file: 'services/python/video_ai_service_enhanced.py',
    port: 8002,
    command: 'npm run video-ai'
  },
  {
    name: 'Gemini Chat Service',
    file: 'services/python/gemini_resume_chat_service.py',
    port: 8003,
    command: 'npm run gemini-chat'
  },
  {
    name: 'AI Resume Service',
    file: 'services/python/ai_service.py',
    port: 8004,
    command: 'npm run ai-service'
  },
  {
    name: 'Job Description Service',
    file: 'services/python/job_description_service.py',
    port: 8008,
    command: 'npm run job-desc-service'
  }
];

async function checkPythonInstallation() {
  log('\n🐍 Checking Python installation...', colors.cyan);
  
  return new Promise((resolve) => {
    const python = spawn('python', ['--version']);
    
    python.stdout.on('data', (data) => {
      log(`✅ Python found: ${data.toString().trim()}`, colors.green);
      resolve(true);
    });
    
    python.stderr.on('data', (data) => {
      log(`✅ Python found: ${data.toString().trim()}`, colors.green);
      resolve(true);
    });
    
    python.on('error', () => {
      log('❌ Python not found. Please install Python 3.8+', colors.red);
      resolve(false);
    });
  });
}

async function checkUvicornInstallation() {
  log('\n🦄 Checking Uvicorn installation...', colors.cyan);
  
  return new Promise((resolve) => {
    const uvicorn = spawn('python', ['-m', 'uvicorn', '--version']);
    
    uvicorn.stdout.on('data', (data) => {
      log(`✅ Uvicorn found: ${data.toString().trim()}`, colors.green);
      resolve(true);
    });
    
    uvicorn.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output.includes('uvicorn')) {
        log(`✅ Uvicorn found: ${output}`, colors.green);
        resolve(true);
      } else {
        log('❌ Uvicorn not found. Install with: npm run setup:python', colors.red);
        resolve(false);
      }
    });
    
    uvicorn.on('error', () => {
      log('❌ Uvicorn not found. Install with: npm run setup:python', colors.red);
      resolve(false);
    });
  });
}

function checkServiceFiles() {
  log('\n📁 Checking Python service files...', colors.cyan);
  
  let allFilesExist = true;
  
  services.forEach(service => {
    const filePath = path.join(process.cwd(), service.file);
    if (fs.existsSync(filePath)) {
      log(`✅ ${service.name}: ${service.file}`, colors.green);
    } else {
      log(`❌ ${service.name}: ${service.file} (NOT FOUND)`, colors.red);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

function checkNodeModules() {
  log('\n📦 Checking Node.js dependencies...', colors.cyan);
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', colors.red);
    return false;
  }
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('❌ node_modules not found. Run: npm install', colors.red);
    return false;
  }
  
  // Check for concurrently specifically
  const concurrentlyPath = path.join(nodeModulesPath, 'concurrently');
  if (!fs.existsSync(concurrentlyPath)) {
    log('❌ concurrently not found. Run: npm install', colors.red);
    return false;
  }
  
  log('✅ Node.js dependencies found', colors.green);
  return true;
}

function checkEnvironmentFiles() {
  log('\n🔐 Checking environment files...', colors.cyan);
  
  const envFiles = ['.env', '.env.local'];
  let hasEnvFile = false;
  
  envFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      log(`✅ Environment file found: ${file}`, colors.green);
      hasEnvFile = true;
    }
  });
  
  if (!hasEnvFile) {
    log('⚠️  No environment files found. You may need API keys for some services.', colors.yellow);
    log('💡 Copy env.local.template to .env.local and add your API keys', colors.yellow);
  }
  
  return true; // Not critical for basic operation
}

async function runPreflightChecks() {
  log('🚀 Pre-flight Checks for dev:full', colors.blue);
  log('=' .repeat(50), colors.blue);
  
  const pythonOk = await checkPythonInstallation();
  const uvicornOk = await checkUvicornInstallation();
  const filesOk = checkServiceFiles();
  const nodeOk = checkNodeModules();
  const envOk = checkEnvironmentFiles();
  
  log('\n📊 Pre-flight Results:', colors.cyan);
  log('=' .repeat(30), colors.cyan);
  
  if (pythonOk && uvicornOk && filesOk && nodeOk) {
    log('🎉 All checks passed! Ready to run dev:full', colors.green);
    log('\n🚀 Starting full development environment...', colors.blue);
    log('💡 Command: npm run dev:full', colors.cyan);
    log('\n📋 Services that will start:', colors.blue);
    services.forEach(service => {
      log(`  • ${service.name} (Port ${service.port})`, colors.blue);
    });
    log('  • Next.js Frontend (Port 3002)', colors.blue);
    
    return true;
  } else {
    log('⚠️  Some checks failed. Please fix the issues above.', colors.yellow);
    log('\n🛠️  Common fixes:', colors.blue);
    log('• Install Python: https://python.org/downloads/', colors.blue);
    log('• Install Python packages: npm run setup:python', colors.blue);
    log('• Install Node deps: npm install', colors.blue);
    log('• Install everything: npm run setup:all', colors.blue);
    log('• Check Python service files exist', colors.blue);
    
    return false;
  }
}

// Export for use as a module
if (require.main === module) {
  runPreflightChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    log(`\n💥 Pre-flight check failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { runPreflightChecks };
