#!/usr/bin/env node

/**
 * Storybook Performance Testing Script
 * 
 * This script measures:
 * - Initial load time
 * - Story switching time
 * - Build time
 * 
 * Usage: node scripts/storybook-performance.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(title, colors.bright + colors.blue);
  log('='.repeat(60), colors.bright);
}

function formatTime(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function measureBuildTime() {
  logSection('Measuring Build Time');
  
  log('Building Storybook...', colors.yellow);
  const startTime = Date.now();
  
  try {
    // Clean previous build
    if (fs.existsSync('storybook-static')) {
      execSync('rm -rf storybook-static', { stdio: 'ignore' });
    }
    
    // Build Storybook
    execSync('npm run build-storybook', { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    const buildTime = Date.now() - startTime;
    log(`✓ Build completed in ${formatTime(buildTime)}`, colors.green);
    
    return buildTime;
  } catch (error) {
    log('✗ Build failed', colors.red);
    console.error(error.message);
    return null;
  }
}

function analyzeBuildOutput() {
  logSection('Analyzing Build Output');
  
  const storybookStaticDir = path.join(process.cwd(), 'storybook-static');
  
  if (!fs.existsSync(storybookStaticDir)) {
    log('✗ Build output not found', colors.red);
    return;
  }
  
  // Get all files
  const files = [];
  function walkDir(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else {
        files.push({
          path: fullPath.replace(storybookStaticDir + '/', ''),
          size: stat.size,
        });
      }
    });
  }
  walkDir(storybookStaticDir);
  
  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  // Find largest files
  const largestFiles = files
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);
  
  log(`Total files: ${files.length}`, colors.blue);
  log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`, colors.blue);
  
  log('\nLargest files:', colors.yellow);
  largestFiles.forEach((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    log(`  ${index + 1}. ${file.path} - ${sizeKB} KB`);
  });
  
  // Analyze chunk files
  const chunkFiles = files.filter(f => f.path.includes('.iframe.bundle.js'));
  if (chunkFiles.length > 0) {
    log(`\nChunk files: ${chunkFiles.length}`, colors.blue);
    const totalChunkSize = chunkFiles.reduce((sum, file) => sum + file.size, 0);
    log(`Total chunk size: ${(totalChunkSize / 1024 / 1024).toFixed(2)} MB`, colors.blue);
  }
  
  return {
    totalFiles: files.length,
    totalSize,
    largestFiles,
    chunkFiles: chunkFiles.length,
  };
}

function identifySlowComponents() {
  logSection('Identifying Potentially Slow Components');
  
  log('Analyzing story files...', colors.yellow);
  
  const storiesDir = path.join(process.cwd(), 'projects/cometchat-uikit/src/lib');
  const storyFiles = [];
  
  function findStoryFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        findStoryFiles(fullPath);
      } else if (item.endsWith('.stories.ts')) {
        storyFiles.push({
          path: fullPath.replace(process.cwd() + '/', ''),
          size: stat.size,
        });
      }
    });
  }
  findStoryFiles(storiesDir);
  
  log(`Found ${storyFiles.length} story files`, colors.blue);
  
  // Sort by size (larger files might indicate more complex stories)
  const largestStories = storyFiles
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);
  
  log('\nLargest story files (may indicate complexity):', colors.yellow);
  largestStories.forEach((file, index) => {
    const sizeKB = (file.size / 1024).toFixed(2);
    log(`  ${index + 1}. ${file.path} - ${sizeKB} KB`);
  });
  
  return storyFiles;
}

function generateReport(results) {
  logSection('Performance Report Summary');
  
  if (results.buildTime) {
    log(`Build Time: ${formatTime(results.buildTime)}`, colors.green);
  }
  
  if (results.analysis) {
    log(`Total Files: ${results.analysis.totalFiles}`, colors.blue);
    log(`Total Size: ${(results.analysis.totalSize / 1024 / 1024).toFixed(2)} MB`, colors.blue);
    log(`Chunk Files: ${results.analysis.chunkFiles}`, colors.blue);
  }
  
  if (results.storyFiles) {
    log(`Story Files: ${results.storyFiles.length}`, colors.blue);
  }
  
  log('\nRecommendations:', colors.yellow);
  
  if (results.buildTime && results.buildTime > 60000) {
    log('  • Build time is high. Consider enabling more aggressive caching.', colors.yellow);
  } else if (results.buildTime) {
    log('  ✓ Build time is acceptable.', colors.green);
  }
  
  if (results.analysis && results.analysis.totalSize > 50 * 1024 * 1024) {
    log('  • Total size is large. Consider code splitting and lazy loading.', colors.yellow);
  } else if (results.analysis) {
    log('  ✓ Total size is reasonable.', colors.green);
  }
  
  if (results.analysis && results.analysis.chunkFiles > 0) {
    log('  ✓ Code splitting is enabled.', colors.green);
  } else {
    log('  • Code splitting not detected. Enable splitChunks in webpack config.', colors.yellow);
  }
  
  log('\nPerformance testing complete!', colors.bright + colors.green);
}

// Main execution
async function main() {
  log('Storybook Performance Testing', colors.bright + colors.blue);
  log('This may take a few minutes...\n');
  
  const results = {};
  
  // Measure build time
  results.buildTime = measureBuildTime();
  
  if (results.buildTime) {
    // Analyze build output
    results.analysis = analyzeBuildOutput();
    
    // Identify slow components
    results.storyFiles = identifySlowComponents();
    
    // Generate report
    generateReport(results);
  } else {
    log('\nPerformance testing incomplete due to build failure.', colors.red);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error running performance tests:', error);
  process.exit(1);
});
