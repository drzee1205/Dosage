#!/usr/bin/env node

/**
 * Script to extract drug data from Nelson Textbook DOCX files
 * This script processes all DOCX files in the 'nelson tables' directory
 * and extracts pediatric drug dosage information.
 */

import { extractDrugsFromDocxFiles, processAndSaveDrugs } from '../src/utils/docxParser';
import { importDrugData, ImportConfig } from '../src/utils/dataImporter';
import * as path from 'path';

async function main() {
  try {
    console.log('🚀 Starting Nelson Textbook data extraction...');
    
    const nelsonTablesPath = path.join(process.cwd(), 'nelson tables');
    
    console.log(`📁 Looking for DOCX files in: ${nelsonTablesPath}`);
    
    // Configure import
    const config: ImportConfig = {
      sourcePath: nelsonTablesPath,
      format: 'docx',
      validateOnly: false,
      mergeWithExisting: false,
      outputPath: path.join(process.cwd(), 'src/data/pediatricDrugsExtracted.ts')
    };
    
    console.log('🔧 Import configuration:');
    console.log(`  - Source: ${config.sourcePath}`);
    console.log(`  - Format: ${config.format}`);
    console.log(`  - Merge with existing: ${config.mergeWithExisting}`);
    console.log(`  - Output: ${config.outputPath}`);
    
    // Import the data
    console.log('📥 Importing drug data...');
    const result = await importDrugData(config);
    
    if (result.success) {
      console.log('✅ Import successful!');
      console.log(`📊 Imported ${result.importedCount} drugs`);
      
      if (result.warnings && result.warnings.length > 0) {
        console.log('⚠️  Warnings:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    } else {
      console.error('❌ Import failed!');
      console.error(`📝 Error: ${result.message}`);
      
      if (result.errors && result.errors.length > 0) {
        console.error('🔍 Errors:');
        result.errors.forEach(error => console.error(`   - ${error}`));
      }
      
      process.exit(1);
    }
    
    console.log('🎉 Nelson Textbook data extraction completed successfully!');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
main();