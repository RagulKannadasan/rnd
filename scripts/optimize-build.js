#!/usr/bin/env node

/**
 * Build optimization script for Netlify deployment
 * This script optimizes the build process and provides performance insights
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build optimization...');

// Check if build directory exists
const buildDir = path.join(__dirname, '..', 'build');
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Analyze build size
function analyzeBuildSize() {
  const files = fs.readdirSync(buildDir, { recursive: true });
  let totalSize = 0;
  const fileSizes = [];

  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.statSync(filePath).isFile()) {
      const size = fs.statSync(filePath).size;
      totalSize += size;
      fileSizes.push({ file, size });
    }
  });

  // Sort by size
  fileSizes.sort((a, b) => b.size - a.size);

  console.log('\n📊 Build Analysis:');
  console.log(`Total build size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log('\nLargest files:');
  fileSizes.slice(0, 10).forEach(({ file, size }) => {
    console.log(`  ${file}: ${(size / 1024).toFixed(2)} KB`);
  });

  // Performance recommendations
  if (totalSize > 5 * 1024 * 1024) { // 5MB
    console.log('\n⚠️  Warning: Build size is large. Consider:');
    console.log('  - Code splitting');
    console.log('  - Image optimization');
    console.log('  - Bundle analysis');
  }
}

// Check for common issues
function checkForIssues() {
  console.log('\n🔍 Checking for common issues...');
  
  const issues = [];
  
  // Check for source maps
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    const staticFiles = fs.readdirSync(staticDir, { recursive: true });
    const hasSourceMaps = staticFiles.some(file => file.endsWith('.map'));
    if (hasSourceMaps) {
      issues.push('Source maps found in production build');
    }
  }
  
  // Check for large images
  const publicDir = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicDir)) {
    const publicFiles = fs.readdirSync(publicDir, { recursive: true });
    publicFiles.forEach(file => {
      if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        const filePath = path.join(publicDir, file);
        const size = fs.statSync(filePath).size;
        if (size > 500 * 1024) { // 500KB
          issues.push(`Large image: ${file} (${(size / 1024).toFixed(2)} KB)`);
        }
      }
    });
  }
  
  if (issues.length > 0) {
    console.log('\n⚠️  Issues found:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('✅ No issues found!');
  }
}

// Generate performance report
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    buildSize: 0,
    recommendations: []
  };
  
  // Calculate build size
  const files = fs.readdirSync(buildDir, { recursive: true });
  files.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.statSync(filePath).isFile()) {
      report.buildSize += fs.statSync(filePath).size;
    }
  });
  
  // Add recommendations
  if (report.buildSize > 5 * 1024 * 1024) {
    report.recommendations.push('Consider code splitting to reduce bundle size');
  }
  
  // Write report
  const reportPath = path.join(__dirname, '..', 'build-performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Performance report saved to: ${reportPath}`);
}

// Main execution
try {
  analyzeBuildSize();
  checkForIssues();
  generateReport();
  console.log('\n✅ Build optimization complete!');
} catch (error) {
  console.error('❌ Error during optimization:', error.message);
  process.exit(1);
}
