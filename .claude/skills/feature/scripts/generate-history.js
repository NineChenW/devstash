#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const currentFeaturePath = path.join(process.cwd(), 'context', 'current-feature.md');
const detailedHistoryPath = path.join(process.cwd(), 'context', 'current-feature-detailed-history.md');

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseCurrentFeature(content) {
  const lines = content.split('\n');
  
  let featureName = '';
  let goals = [];
  let notes = [];
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.startsWith('# ') && !line.startsWith('##')) {
      featureName = line.replace('# ', '').trim();
      continue;
    }
    
    if (line.startsWith('## Goals')) {
      currentSection = 'goals';
      continue;
    } else if (line.startsWith('## Notes')) {
      currentSection = 'notes';
      continue;
    } else if (line.startsWith('## History') || line.startsWith('<!--')) {
      currentSection = '';
      continue;
    }
    
    if (currentSection === 'goals' && line.trim()) {
      const goalText = line.replace(/^[-*]\s*/, '').trim();
      if (goalText && !goalText.startsWith('<!--')) {
        goals.push(goalText);
      }
    } else if (currentSection === 'notes' && line.trim()) {
      const noteText = line.replace(/^[-*]\s*/, '').trim();
      if (noteText && !noteText.startsWith('<!--')) {
        notes.push(noteText);
      }
    }
  }
  
  return { featureName, goals, notes };
}

function generateDetailedRecord(featureName, goals, notes, date) {
  let record = `- **${date}**: ${featureName}`;
  
  if (goals.length > 0 || notes.length > 0) {
    const parts = [];
    
    if (goals.length > 0) {
      const goalsText = goals.join('; ');
      parts.push(goalsText);
    }
    
    if (notes.length > 0) {
      const notesText = notes.join('; ');
      parts.push(notesText);
    }
    
    record += ` - ${parts.join('. ')}`;
  }
  
  return record;
}

function generateSummarizedRecord(featureName, date) {
  return `- **${date}**: ${featureName}`;
}

function appendRecord(filePath, record) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const isDetailedHistory = filePath.includes('detailed-history');
  const sectionHeader = isDetailedHistory ? '## Detailed History Records' : '## History';
  
  let historyIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(sectionHeader)) {
      historyIndex = i;
    }
  }
  
  if (historyIndex === -1) {
    console.error(`${sectionHeader} section not found in file`);
    process.exit(1);
  }
  
  let insertIndex = historyIndex + 1;
  while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
    insertIndex++;
  }
  
  while (insertIndex < lines.length && lines[insertIndex].trim() !== '' && !lines[insertIndex].startsWith('- **')) {
    insertIndex++;
  }
  
  if (insertIndex >= lines.length) {
    insertIndex = lines.length;
  }
  
  lines.splice(insertIndex, 0, record);
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`✓ Appended record to ${path.basename(filePath)}`);
}

'use strict';

try {
  console.log('📝 Generating history records...\n');
  
  if (!fs.existsSync(currentFeaturePath)) {
    console.error(`File not found: ${currentFeaturePath}`);
    process.exit(1);
  }
  
  const currentFeatureContent = fs.readFileSync(currentFeaturePath, 'utf8');
  
  const { featureName, goals, notes } = parseCurrentFeature(currentFeatureContent);
  
  const date = getTodayDate();
  console.log(`Feature: ${featureName}`);
  console.log(`Date: ${date}`);
  console.log(`Goals: ${goals.length} items`);
  console.log(`Notes: ${notes.length} items\n`);
  
  if (!featureName || featureName === 'Current Feature') {
    console.log('ℹ️  No active feature found - skipping history generation');
    process.exit(0);
  }
  
  const detailedRecord = generateDetailedRecord(featureName, goals, notes, date);
  const summarizedRecord = generateSummarizedRecord(featureName, date);
  
  console.log('Detailed record:', detailedRecord);
  console.log('Summarized record:', summarizedRecord);
  console.log('');
  
  appendRecord(detailedHistoryPath, detailedRecord);
  appendRecord(currentFeaturePath, summarizedRecord);
  
  console.log('\n✅ History records generated successfully!');
  
} catch (error) {
  console.error('❌ Error generating history records:', error.message);
  process.exit(1);
}