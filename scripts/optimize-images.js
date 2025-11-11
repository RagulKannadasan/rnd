#!/usr/bin/env node

/**
 * Image optimization script for Netlify deployment
 * This script provides recommendations for optimizing images
 */

const fs = require('fs');
const path = require('path');

console.log('🖼️  Starting image optimization analysis...');

const publicDir = path.join(__dirname, '..', 'public');
const maxSize = 500 * 1024; // 500KB
const recommendations = [];

function analyzeImages(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      analyzeImages(filePath);
    } else if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      const size = stat.size;
      const relativePath = path.relative(publicDir, filePath);
      
      if (size > maxSize) {
        recommendations.push({
          file: relativePath,
          size: size,
          sizeKB: (size / 1024).toFixed(2),
          recommendation: getOptimizationRecommendation(file, size)
        });
      }
    }
  });
}

function getOptimizationRecommendation(filename, size) {
  const sizeMB = size / (1024 * 1024);
  
  if (sizeMB > 3) {
    return 'CRITICAL: Compress to < 500KB. Consider WebP format and reduce dimensions.';
  } else if (sizeMB > 1) {
    return 'HIGH: Compress to < 500KB. Use WebP format and optimize quality.';
  } else {
    return 'MEDIUM: Compress to < 500KB. Use image optimization tools.';
  }
}

function generateOptimizationCommands() {
  console.log('\n🔧 Optimization Commands:');
  console.log('\n# Install image optimization tools:');
  console.log('npm install --save-dev imagemin imagemin-webp imagemin-mozjpeg imagemin-pngquant');
  
  console.log('\n# Or use online tools:');
  console.log('- TinyPNG: https://tinypng.com/');
  console.log('- Squoosh: https://squoosh.app/');
  console.log('- ImageOptim: https://imageoptim.com/');
  
  console.log('\n# Convert to WebP format:');
  recommendations.forEach(rec => {
    if (rec.file.match(/\.(jpg|jpeg|png)$/i)) {
      const webpFile = rec.file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      console.log(`# Convert ${rec.file} to ${webpFile}`);
    }
  });
}

function createOptimizedVersions() {
  console.log('\n📝 Creating optimization recommendations...');
  
  const report = {
    timestamp: new Date().toISOString(),
    totalImages: recommendations.length,
    totalSize: recommendations.reduce((sum, rec) => sum + rec.size, 0),
    recommendations: recommendations.map(rec => ({
      file: rec.file,
      currentSize: `${rec.sizeKB} KB`,
      priority: rec.size > 3 * 1024 * 1024 ? 'CRITICAL' : 
                rec.size > 1024 * 1024 ? 'HIGH' : 'MEDIUM',
      action: rec.recommendation
    }))
  };
  
  const reportPath = path.join(__dirname, '..', 'image-optimization-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Image optimization report saved to: ${reportPath}`);
}

// Main execution
try {
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found');
    process.exit(1);
  }
  
  analyzeImages(publicDir);
  
  if (recommendations.length === 0) {
    console.log('✅ All images are optimized!');
  } else {
    console.log(`\n⚠️  Found ${recommendations.length} images that need optimization:`);
    recommendations.forEach(rec => {
      console.log(`\n📁 ${rec.file}`);
      console.log(`   Size: ${rec.sizeKB} KB`);
      console.log(`   Action: ${rec.recommendation}`);
    });
    
    generateOptimizationCommands();
    createOptimizedVersions();
  }
  
  console.log('\n✅ Image optimization analysis complete!');
} catch (error) {
  console.error('❌ Error during image analysis:', error.message);
  process.exit(1);
}
