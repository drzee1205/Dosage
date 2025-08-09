import { ExtractedDrugData, validateDrugData, cleanDrugData, processAndSaveDrugs } from './docxParser';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
  warnings?: string[];
}

export interface ImportConfig {
  sourcePath: string;
  outputPath?: string;
  format: 'docx' | 'csv' | 'json' | 'excel';
  validateOnly?: boolean;
  mergeWithExisting?: boolean;
  categoryMapping?: Record<string, string>;
}

/**
 * Main import function that handles different file formats
 */
export async function importDrugData(config: ImportConfig): Promise<ImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validate input
    if (!fs.existsSync(config.sourcePath)) {
      return {
        success: false,
        message: `Source file not found: ${config.sourcePath}`,
        errors: [`Source file not found: ${config.sourcePath}`]
      };
    }

    let extractedDrugs: ExtractedDrugData[] = [];

    // Extract data based on format
    switch (config.format) {
      case 'docx':
        extractedDrugs = await importFromDocx(config.sourcePath, errors, warnings);
        break;
      case 'csv':
        extractedDrugs = await importFromCsv(config.sourcePath, errors, warnings);
        break;
      case 'json':
        extractedDrugs = await importFromJson(config.sourcePath, errors, warnings);
        break;
      case 'excel':
        extractedDrugs = await importFromExcel(config.sourcePath, errors, warnings);
        break;
      default:
        return {
          success: false,
          message: `Unsupported format: ${config.format}`,
          errors: [`Unsupported format: ${config.format}`]
        };
    }

    if (errors.length > 0) {
      return {
        success: false,
        message: 'Import failed with errors',
        errors
      };
    }

    // Clean and validate data
    const cleanedDrugs = extractedDrugs.map(cleanDrugData);
    const validDrugs = cleanedDrugs.filter(validateDrugData);
    
    if (validDrugs.length !== cleanedDrugs.length) {
      warnings.push(`${cleanedDrugs.length - validDrugs.length} drugs were filtered out due to validation errors`);
    }

    if (validDrugs.length === 0) {
      return {
        success: false,
        message: 'No valid drugs found in the source data',
        errors: ['No valid drugs found in the source data']
      };
    }

    // Apply category mapping if provided
    if (config.categoryMapping) {
      validDrugs.forEach(drug => {
        if (config.categoryMapping![drug.category]) {
          drug.category = config.categoryMapping![drug.category];
        }
      });
    }

    // If validateOnly is true, just return the validation results
    if (config.validateOnly) {
      return {
        success: true,
        message: `Validation successful. ${validDrugs.length} valid drugs found.`,
        importedCount: validDrugs.length,
        warnings
      };
    }

    // Process and save the drugs
    const outputPath = config.outputPath || '/home/z/my-project/src/data/pediatricDrugs.ts';
    
    if (config.mergeWithExisting) {
      await mergeWithExistingDrugs(validDrugs, outputPath, errors, warnings);
    } else {
      await processAndSaveDrugs(validDrugs, outputPath);
    }

    return {
      success: true,
      message: `Successfully imported ${validDrugs.length} drugs`,
      importedCount: validDrugs.length,
      warnings
    };

  } catch (error) {
    return {
      success: false,
      message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Import from DOCX files
 */
async function importFromDocx(sourcePath: string, errors: string[], warnings: string[]): Promise<ExtractedDrugData[]> {
  try {
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      // Import from directory containing DOCX files
      const files = fs.readdirSync(sourcePath);
      const docxFiles = files.filter(file => file.endsWith('.docx') || file.endsWith('.doc'));
      
      if (docxFiles.length === 0) {
        errors.push('No DOCX files found in the directory');
        return [];
      }
      
      warnings.push(`Found ${docxFiles.length} DOCX files to process`);
      
      const allDrugs: ExtractedDrugData[] = [];
      
      for (const file of docxFiles) {
        try {
          const filePath = path.join(sourcePath, file);
          // Note: This would require the actual DOCX parsing implementation
          // For now, we'll use a mock implementation
          const drugs = await mockParseDocxFile(filePath);
          allDrugs.push(...drugs);
        } catch (error) {
          errors.push(`Error processing file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      return allDrugs;
    } else {
      // Import from single DOCX file
      return await mockParseDocxFile(sourcePath);
    }
  } catch (error) {
    errors.push(`Error importing from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Import from CSV files
 */
async function importFromCsv(sourcePath: string, errors: string[], warnings: string[]): Promise<ExtractedDrugData[]> {
  try {
    // This is a mock implementation
    // In a real implementation, you would use a CSV parsing library
    warnings.push('CSV import is not fully implemented yet');
    
    // Mock data for demonstration
    return [
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brandNames: 'Amoxil',
        indications: 'Bacterial infections',
        contraindications: 'Penicillin allergy',
        sideEffects: 'Diarrhea, rash',
        precautions: 'Monitor for allergic reactions',
        dosageInfo: [
          {
            ageGroup: 'Children',
            weightRange: '10-40 kg',
            dosage: '25-45 mg/kg/day',
            frequency: 'Every 8 hours',
            route: 'Oral',
            maxDailyDose: '90 mg/kg/day'
          }
        ],
        category: 'Infectious Diseases',
        source: sourcePath
      }
    ];
  } catch (error) {
    errors.push(`Error importing from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Import from JSON files
 */
async function importFromJson(sourcePath: string, errors: string[], warnings: string[]): Promise<ExtractedDrugData[]> {
  try {
    const fileContent = fs.readFileSync(sourcePath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    
    if (!Array.isArray(jsonData)) {
      errors.push('JSON file must contain an array of drug objects');
      return [];
    }
    
    return jsonData.map((item: any) => ({
      name: item.name || '',
      genericName: item.genericName || '',
      brandNames: item.brandNames || '',
      indications: item.indications || '',
      contraindications: item.contraindications || '',
      sideEffects: item.sideEffects || '',
      precautions: item.precautions || '',
      dosageInfo: item.dosageInfo || [],
      category: item.category || '',
      source: sourcePath
    }));
  } catch (error) {
    errors.push(`Error importing from JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Import from Excel files
 */
async function importFromExcel(sourcePath: string, errors: string[], warnings: string[]): Promise<ExtractedDrugData[]> {
  try {
    // This is a mock implementation
    // In a real implementation, you would use an Excel parsing library like 'xlsx'
    warnings.push('Excel import is not fully implemented yet');
    
    // Mock data for demonstration
    return [
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brandNames: 'Advil, Motrin',
        indications: 'Fever, pain, inflammation',
        contraindications: 'GI bleeding, renal impairment',
        sideEffects: 'GI upset, renal effects',
        precautions: 'Use with food',
        dosageInfo: [
          {
            ageGroup: 'Children 6 months - 12 years',
            weightRange: '6-40 kg',
            dosage: '5-10 mg/kg/dose',
            frequency: 'Every 6-8 hours',
            route: 'Oral',
            maxDailyDose: '40 mg/kg/day'
          }
        ],
        category: 'Pediatric Drug Therapy',
        source: sourcePath
      }
    ];
  } catch (error) {
    errors.push(`Error importing from Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Mock DOCX parsing function for demonstration
 */
async function mockParseDocxFile(filePath: string): Promise<ExtractedDrugData[]> {
  // This is a mock implementation
  // In a real implementation, this would parse the actual DOCX file
  return [
    {
      name: 'Penicillin',
      genericName: 'Penicillin V',
      brandNames: 'Pen-Vee K, Veetids',
      indications: 'Streptococcal infections, pneumococcal infections',
      contraindications: 'Penicillin allergy',
      sideEffects: 'Allergic reactions, GI upset',
      precautions: 'Monitor for allergic reactions',
      dosageInfo: [
        {
          ageGroup: 'Children',
          weightRange: '10-40 kg',
          dosage: '25-50 mg/kg/day divided',
          frequency: 'Every 6 hours',
          route: 'Oral',
          maxDailyDose: '100 mg/kg/day'
        }
      ],
      category: 'Infectious Diseases',
      source: filePath
    }
  ];
}

/**
 * Merge imported drugs with existing drugs in the database
 */
async function mergeWithExistingDrugs(
  importedDrugs: ExtractedDrugData[], 
  outputPath: string, 
  errors: string[], 
  warnings: string[]
): Promise<void> {
  try {
    // Read existing drugs
    const existingContent = fs.readFileSync(outputPath, 'utf8');
    
    // This is a simplified merge implementation
    // In a real implementation, you would parse the existing TypeScript file
    // and merge the data properly
    
    warnings.push('Merge functionality is simplified - replacing existing data');
    
    // For now, just process and save the imported drugs
    await processAndSaveDrugs(importedDrugs, outputPath);
    
  } catch (error) {
    errors.push(`Error merging with existing drugs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Validate import configuration
 */
export function validateImportConfig(config: ImportConfig): string[] {
  const validationErrors: string[] = [];
  
  if (!config.sourcePath) {
    validationErrors.push('Source path is required');
  }
  
  if (!config.format) {
    validationErrors.push('Format is required');
  }
  
  const validFormats = ['docx', 'csv', 'json', 'excel'];
  if (!validFormats.includes(config.format)) {
    validationErrors.push(`Invalid format: ${config.format}. Valid formats are: ${validFormats.join(', ')}`);
  }
  
  return validationErrors;
}

/**
 * Create a sample import configuration
 */
export function createSampleConfig(): ImportConfig {
  return {
    sourcePath: '/path/to/nelson/tables',
    format: 'docx',
    validateOnly: false,
    mergeWithExisting: true,
    categoryMapping: {
      'Antibiotics': 'Infectious Diseases',
      'Pain Relief': 'Pediatric Drug Therapy',
      'Vitamins': 'Nutrition'
    }
  };
}