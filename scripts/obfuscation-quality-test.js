#!/usr/bin/env node

/**
 * Advanced Obfuscation Quality Tester
 * Tests the effectiveness of Phase 2 obfuscation features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ObfuscationQualityTester {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.results = {
      readabilityScore: 0,
      identifierObfuscation: 0,
      stringObfuscation: 0,
      controlFlowObfuscation: 0,
      overallScore: 0,
      recommendations: []
    };
  }

  async runQualityTest() {
    console.log('\n🔍 Starting Advanced Obfuscation Quality Test...\n');

    if (!fs.existsSync(this.distPath)) {
      console.error('❌ Build directory does not exist. Run build first.');
      process.exit(1);
    }

    const jsFiles = this.getJavaScriptFiles();
    
    if (jsFiles.length === 0) {
      console.error('❌ No JavaScript files found in build.');
      process.exit(1);
    }

    for (const file of jsFiles) {
      console.log(`📄 Analyzing: ${file}`);
      await this.analyzeFile(file);
    }

    this.calculateOverallScore();
    this.generateReport();
  }

  getJavaScriptFiles() {
    const files = fs.readdirSync(this.distPath);
    return files
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(this.distPath, file));
  }

  async analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    console.log(`   📊 File size: ${(content.length / 1024).toFixed(2)} KB`);

    // Test 1: Readability Analysis
    const readabilityScore = this.testReadability(content);
    console.log(`   📖 Readability reduction: ${readabilityScore}%`);

    // Test 2: Identifier Obfuscation
    const identifierScore = this.testIdentifierObfuscation(content);
    console.log(`   🔤 Identifier obfuscation: ${identifierScore}%`);

    // Test 3: String Obfuscation
    const stringScore = this.testStringObfuscation(content);
    console.log(`   🧵 String obfuscation: ${stringScore}%`);

    // Test 4: Control Flow Obfuscation
    const controlFlowScore = this.testControlFlowObfuscation(content);
    console.log(`   🌊 Control flow obfuscation: ${controlFlowScore}%`);

    // Test 5: Advanced Features Detection
    this.testAdvancedFeatures(content);

    // Update cumulative results
    this.results.readabilityScore += readabilityScore;
    this.results.identifierObfuscation += identifierScore;
    this.results.stringObfuscation += stringScore;
    this.results.controlFlowObfuscation += controlFlowScore;

    console.log('');
  }

  testReadability(content) {
    // Test for obfuscated patterns that reduce readability
    const obfuscatedPatterns = [
      // Single letter functions and variables
      /function\s+[a-zA-Z_$]\s*\(/g,
      /var\s+[a-zA-Z_$]\s*=/g,
      /let\s+[a-zA-Z_$]\s*=/g,
      /const\s+[a-zA-Z_$]\s*=/g,
      // Hex patterns and encoded identifiers
      /0x[0-9a-fA-F]+/g,
      // Complex nested structures
      /\(\s*[^)]*\([^)]*\)/g,
      // Ternary operators
      /\?[^:]*:/g,
      // String array patterns
      /\[[^\]]*["'][^"']*["'][^\]]*\]/g
    ];

    let obfuscatedMatches = 0;
    obfuscatedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        obfuscatedMatches += matches.length;
      }
    });

    // Test for readable patterns (these reduce the score)
    const readablePatterns = [
      /function\s+[a-zA-Z_][a-zA-Z0-9_]{3,}\s*\(/g,
      /var\s+[a-zA-Z_][a-zA-Z0-9_]{3,}\s*=/g,
      /let\s+[a-zA-Z_][a-zA-Z0-9_]{3,}\s*=/g,
      /const\s+[a-zA-Z_][a-zA-Z0-9_]{3,}\s*=/g,
      /class\s+[a-zA-Z_][a-zA-Z0-9_]{3,}/g
    ];

    let readableMatches = 0;
    readablePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        readableMatches += matches.length;
      }
    });

    // Calculate obfuscation score based on ratio
    const totalLines = content.split('\n').length;
    const obfuscationDensity = (obfuscatedMatches / totalLines) * 100;
    const readabilityPenalty = (readableMatches / totalLines) * 50;
    
    const score = Math.max(0, Math.min(100, obfuscationDensity - readabilityPenalty));
    return score;
  }

  testIdentifierObfuscation(content) {
    // Test for obfuscated identifiers (single letters, hex patterns)
    const singleLetterIds = content.match(/\b[a-zA-Z_$]\b/g) || [];
    const doubleLetterIds = content.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]\b/g) || [];
    const hexPatternIds = content.match(/\b[a-zA-Z_$][a-fA-F0-9]+\b/g) || [];
    
    // Test for readable identifiers that shouldn't be there
    const readableIdentifiers = content.match(/\b[a-zA-Z_$][a-zA-Z0-9_$]{3,}\b/g) || [];
    
    // Filter out known acceptable identifiers and common words
    const commonWords = [
      'UnicornStudio', 'console', 'window', 'document', 'undefined', 'function',
      'length', 'prototype', 'constructor', 'toString', 'valueOf', 'hasOwnProperty',
      'String', 'Number', 'Boolean', 'Array', 'Object', 'Error', 'Math', 'Date',
      'RegExp', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'arguments',
      'return', 'break', 'continue', 'throw', 'catch', 'finally', 'switch',
      'charCodeAt', 'fromCharCode', 'indexOf', 'slice', 'charAt', 'match'
    ];
    
    const filteredReadable = readableIdentifiers.filter(id => 
      !commonWords.includes(id) && !id.match(/^[A-Z_][A-Z0-9_]*$/) // Exclude constants
    );

    const obfuscatedIds = singleLetterIds.length + doubleLetterIds.length + hexPatternIds.length;
    const totalRelevantIds = obfuscatedIds + filteredReadable.length;
    
    if (totalRelevantIds === 0) return 0;

    const obfuscationRate = (obfuscatedIds / totalRelevantIds) * 100;
    return Math.min(100, obfuscationRate);
  }

  testStringObfuscation(content) {
    // Look for string array patterns
    const stringArrayPattern = /var\s+[a-fA-F0-9_]+\s*=\s*\[.*?\]/g;
    const stringArrays = content.match(stringArrayPattern) || [];

    // Look for encoded strings
    const base64Pattern = /["'][A-Za-z0-9+/=]{20,}["']/g;
    const encodedStrings = content.match(base64Pattern) || [];

    // Look for plain text strings (should be minimal)
    const plainStrings = content.match(/["'][a-zA-Z\s]{10,}["']/g) || [];

    const totalStrings = stringArrays.length + encodedStrings.length + plainStrings.length;
    if (totalStrings === 0) return 100; // No strings found, perfect

    const obfuscatedStrings = stringArrays.length + encodedStrings.length;
    const obfuscationRate = (obfuscatedStrings / totalStrings) * 100;

    return Math.min(100, obfuscationRate);
  }

  testControlFlowObfuscation(content) {
    // Look for control flow flattening patterns
    const switchStatements = content.match(/switch\s*\(/g) || [];
    const whileLoops = content.match(/while\s*\(/g) || [];
    const continueStatements = content.match(/continue;?/g) || [];
    const breakStatements = content.match(/break;?/g) || [];
    
    // Look for state machine patterns (common in control flow flattening)
    const stateMachinePatterns = [
      /for\s*\(\s*;;\s*\)/g,
      /for\s*\(\s*var\s+[a-zA-Z_$][^;]*;[^;]*;[^)]*\)/g,
      /while\s*\(\s*!?[a-zA-Z_$][a-zA-Z0-9_$]*\s*\)/g
    ];

    // Look for complex conditional patterns
    const complexConditionals = [
      /\?\s*[^:]*:[^;]*\?/g, // Nested ternary
      /&&\s*[^|&]*\|\|/g,    // Mixed logical operators
      /!\s*!\s*[a-zA-Z_$]/g  // Double negation
    ];

    // Look for dead code injection patterns
    const deadCodePatterns = [
      /if\s*\(false\)/g,
      /if\s*\(true\)/g,
      /return\s+void\s+0/g,
      /\(\s*function\s*\(\s*\)\s*\{\s*\}\s*\)\s*\(\s*\)/g
    ];

    let stateMachineScore = 0;
    stateMachinePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) stateMachineScore += matches.length * 15;
    });

    let complexityScore = 0;
    complexConditionals.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) complexityScore += matches.length * 10;
    });

    let deadCodeScore = 0;
    deadCodePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) deadCodeScore += matches.length * 5;
    });

    // Basic control flow score
    let basicScore = 0;
    if (switchStatements.length > 0) basicScore += switchStatements.length * 8;
    if (whileLoops.length > 0) basicScore += whileLoops.length * 5;
    if (continueStatements.length > 0) basicScore += continueStatements.length * 3;
    if (breakStatements.length > 0) basicScore += breakStatements.length * 3;

    const totalScore = stateMachineScore + complexityScore + deadCodeScore + basicScore;
    return Math.min(100, totalScore);
  }

  testAdvancedFeatures(content) {
    const features = [];

    // Test for string array rotation and decoding
    if (content.match(/W\(\)\s*\{\s*(?:const|var)\s+[a-zA-Z_$]/)) {
      features.push('✅ String array rotation detected');
    }

    // Test for encoded string patterns
    if (content.match(/[a-zA-Z0-9+/=]{20,}/)) {
      features.push('✅ Base64/encoded strings detected');
    }

    // Test for self-defending code patterns
    if (content.match(/function\s*\(\s*\)\s*\{\s*return\s*["']newState["']/)) {
      features.push('✅ Self-defending code detected');
    }

    // Test for anti-debug patterns
    if (content.match(/debugger|console\.clear|setInterval.*debugger/)) {
      features.push('✅ Anti-debug protection detected');
    }

    // Test for unicode escape sequences
    if (content.match(/\\u[0-9a-fA-F]{4}/)) {
      features.push('✅ Unicode escape sequences detected');
    }

    // Test for hex escape sequences
    if (content.match(/\\x[0-9a-fA-F]{2}/)) {
      features.push('✅ Hex escape sequences detected');
    }

    // Test for string splitting/array patterns
    if (content.match(/\[["'][^"']{1,10}["'],["'][^"']{1,10}["']/)) {
      features.push('✅ String array splitting detected');
    }

    // Test for function expression patterns
    if (content.match(/\(\s*function\s*\(\s*\)\s*\{[\s\S]*?\}\s*\)\s*\(\s*\)/)) {
      features.push('✅ IIFE patterns detected');
    }

    // Test for domain lock patterns
    if (content.match(/location\.hostname|window\.location/)) {
      features.push('✅ Domain lock patterns detected');
    }

    // Test for RC4 decryption patterns
    if (content.match(/charCodeAt.*fromCharCode.*%\s*256/)) {
      features.push('✅ RC4 decryption detected');
    }

    // Test for object key transformation
    if (content.match(/\['[a-zA-Z0-9_]+'\]/)) {
      features.push('✅ Object key transformation detected');
    }

    if (features.length === 0) {
      features.push('⚠️  No advanced features detected');
      this.results.recommendations.push('Enable more advanced obfuscation features');
    }

    console.log('   🚀 Advanced features:');
    features.forEach(feature => console.log(`      ${feature}`));
  }

  calculateOverallScore() {
    const scores = [
      this.results.readabilityScore,
      this.results.identifierObfuscation,
      this.results.stringObfuscation,
      this.results.controlFlowObfuscation
    ];

    this.results.overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateReport() {
    console.log('\n📋 Advanced Obfuscation Quality Report');
    console.log('═══════════════════════════════════════\n');

    console.log(`📖 Readability Reduction: ${this.results.readabilityScore.toFixed(1)}%`);
    console.log(`🔤 Identifier Obfuscation: ${this.results.identifierObfuscation.toFixed(1)}%`);
    console.log(`🧵 String Obfuscation: ${this.results.stringObfuscation.toFixed(1)}%`);
    console.log(`🌊 Control Flow Obfuscation: ${this.results.controlFlowObfuscation.toFixed(1)}%`);
    console.log(`\n🎯 Overall Quality Score: ${this.results.overallScore.toFixed(1)}%\n`);

    // Quality assessment
    const score = this.results.overallScore;
    let assessment = '';
    let emoji = '';

    if (score >= 90) {
      assessment = 'Excellent - Professional grade obfuscation';
      emoji = '🔒';
    } else if (score >= 75) {
      assessment = 'Good - Strong protection against casual analysis';
      emoji = '🛡️';
    } else if (score >= 60) {
      assessment = 'Fair - Basic protection, room for improvement';
      emoji = '⚠️';
    } else {
      assessment = 'Poor - Minimal protection, requires enhancement';
      emoji = '❌';
    }

    console.log(`${emoji} Assessment: ${assessment}\n`);

    // Requirements validation
    console.log('✅ Phase 2 Requirements Validation:');
    
    const readabilityTarget = 90; // >90% readability reduction
    const readabilityStatus = this.results.readabilityScore >= readabilityTarget ? '✅' : '❌';
    console.log(`   ${readabilityStatus} Code readability reduction: ${this.results.readabilityScore.toFixed(1)}% (target: >${readabilityTarget}%)`);

    const identifierTarget = 80; // Strong identifier obfuscation
    const identifierStatus = this.results.identifierObfuscation >= identifierTarget ? '✅' : '❌';
    console.log(`   ${identifierStatus} Identifier obfuscation: ${this.results.identifierObfuscation.toFixed(1)}% (target: >${identifierTarget}%)`);

    const stringTarget = 70; // Good string protection
    const stringStatus = this.results.stringObfuscation >= stringTarget ? '✅' : '❌';
    console.log(`   ${stringStatus} String protection: ${this.results.stringObfuscation.toFixed(1)}% (target: >${stringTarget}%)`);

    const controlFlowTarget = 60; // Moderate control flow obfuscation
    const controlFlowStatus = this.results.controlFlowObfuscation >= controlFlowTarget ? '✅' : '❌';
    console.log(`   ${controlFlowStatus} Control flow obfuscation: ${this.results.controlFlowObfuscation.toFixed(1)}% (target: >${controlFlowTarget}%)`);

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }

    console.log('\n🎯 Next Steps for Phase 2:');
    console.log('   • Implement IntegrityVerifier integration');
    console.log('   • Add security event logging');
    console.log('   • Test tamper detection scenarios');
    console.log('   • Validate <100ms verification performance\n');

    // Exit with appropriate code
    const allTargetsMet = [readabilityStatus, identifierStatus, stringStatus, controlFlowStatus]
      .every(status => status === '✅');
    
    if (allTargetsMet) {
      console.log('🎉 All Phase 2 obfuscation targets achieved!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Some Phase 2 targets not yet met. Adjust configuration and retry.\n');
      process.exit(1);
    }
  }
}

const tester = new ObfuscationQualityTester();
tester.runQualityTest().catch(error => {
  console.error('❌ Obfuscation quality test failed:', error);
  process.exit(1);
});
