import * as fs from 'fs';\nimport * as path from 'path';\n\n// Interface for extracted drug data\nexport interface ExtractedDrugData {\n  name: string;\n  genericName?: string;\n  brandNames?: string;\n  indications: string;\n  contraindications?: string;\n  sideEffects?: string;\n  precautions?: string;\n  dosageInfo: DosageInfo[];\n  category: string;\n  source: string;\n}\n\nexport interface DosageInfo {\n  ageGroup: string;\n  weightRange: string;\n  dosage: string;\n  frequency: string;\n  route: string;\n  maxDailyDose?: string;\n}\n\nexport interface ParsedTableData {\n  category: string;\n  drugs: ExtractedDrugData[];\n  tableName: string;\n  pageNumber?: number;\n}\n\n/**\n * Parse DOCX file to extract drug dosage tables\n * This is a placeholder implementation that would need a proper DOCX parsing library\n */\nexport async function parseDocxFile(filePath: string): Promise<ParsedTableData[]> {\n  try {\n    // Check if file exists\n    if (!fs.existsSync(filePath)) {\n      throw new Error(`File not found: ${filePath}`);\n    }\n\n    // This is a mock implementation\n    // In a real implementation, you would use a library like 'mammoth' or 'docx'\n    // to parse the DOCX file and extract table data\n    \n    console.log(`Parsing DOCX file: ${filePath}`);\n    \n    // Mock parsed data - in reality this would come from the DOCX parser\n    const mockData: ParsedTableData[] = [\n      {\n        category: 'Infectious Diseases',\n        tableName: 'Antibiotic Dosages for Children',\n        pageNumber: 1,\n        drugs: [\n          {\n            name: 'Amoxicillin',\n            genericName: 'Amoxicillin',\n            brandNames: 'Amoxil, Augmentin',\n            indications: 'Bacterial infections, otitis media, strep throat',\n            contraindications: 'Penicillin allergy',\n            sideEffects: 'Diarrhea, rash, allergic reactions',\n            precautions: 'Monitor for allergic reactions, adjust dose in renal impairment',\n            dosageInfo: [\n              {\n                ageGroup: 'Children < 40 kg',\n                weightRange: '10-40 kg',\n                dosage: '25-45 mg/kg/day divided',\n                frequency: 'Every 8-12 hours',\n                route: 'Oral',\n                maxDailyDose: '90 mg/kg/day'\n              }\n            ],\n            category: 'Infectious Diseases',\n            source: filePath\n          }\n        ]\n      }\n    ];\n\n    return mockData;\n  } catch (error) {\n    console.error('Error parsing DOCX file:', error);\n    throw error;\n  }\n}\n\n/**\n * Extract drug data from multiple DOCX files in a directory\n */\nexport async function extractDrugsFromDocxFiles(directoryPath: string): Promise<ExtractedDrugData[]> {\n  try {\n    if (!fs.existsSync(directoryPath)) {\n      throw new Error(`Directory not found: ${directoryPath}`);\n    }\n\n    const files = fs.readdirSync(directoryPath);\n    const docxFiles = files.filter(file => file.endsWith('.docx') || file.endsWith('.doc'));\n    \n    const allDrugs: ExtractedDrugData[] = [];\n\n    for (const file of docxFiles) {\n      const filePath = path.join(directoryPath, file);\n      try {\n        const parsedData = await parseDocxFile(filePath);\n        const drugs = parsedData.flatMap(data => data.drugs);\n        allDrugs.push(...drugs);\n      } catch (error) {\n        console.error(`Error parsing file ${file}:`, error);\n      }\n    }\n\n    return allDrugs;\n  } catch (error) {\n    console.error('Error extracting drugs from DOCX files:', error);\n    throw error;\n  }\n}\n\n/**\n * Validate extracted drug data\n */\nexport function validateDrugData(drug: ExtractedDrugData): boolean {\n  const requiredFields = ['name', 'indications', 'dosageInfo', 'category'];\n  \n  for (const field of requiredFields) {\n    if (!drug[field as keyof ExtractedDrugData]) {\n      console.warn(`Missing required field '${field}' in drug: ${drug.name}`);\n      return false;\n    }\n  }\n\n  if (!Array.isArray(drug.dosageInfo) || drug.dosageInfo.length === 0) {\n    console.warn(`No dosage information for drug: ${drug.name}`);\n    return false;\n  }\n\n  for (const dosage of drug.dosageInfo) {\n    const dosageRequiredFields = ['ageGroup', 'weightRange', 'dosage', 'frequency', 'route'];\n    for (const field of dosageRequiredFields) {\n      if (!dosage[field as keyof DosageInfo]) {\n        console.warn(`Missing required dosage field '${field}' in drug: ${drug.name}`);\n        return false;\n      }\n    }\n  }\n\n  return true;\n}\n\n/**\n * Clean and normalize extracted drug data\n */\nexport function cleanDrugData(drug: ExtractedDrugData): ExtractedDrugData {\n  return {\n    ...drug,\n    name: drug.name.trim(),\n    genericName: drug.genericName?.trim(),\n    brandNames: drug.brandNames?.trim(),\n    indications: drug.indications.trim(),\n    contraindications: drug.contraindications?.trim(),\n    sideEffects: drug.sideEffects?.trim(),\n    precautions: drug.precautions?.trim(),\n    category: drug.category.trim(),\n    dosageInfo: drug.dosageInfo.map(dosage => ({\n      ...dosage,\n      ageGroup: dosage.ageGroup.trim(),\n      weightRange: dosage.weightRange.trim(),\n      dosage: dosage.dosage.trim(),\n      frequency: dosage.frequency.trim(),\n      route: dosage.route.trim(),\n      maxDailyDose: dosage.maxDailyDose?.trim()\n    }))\n  };\n}\n\n/**\n * Convert extracted drug data to the format used in the application\n */\nexport function convertToAppFormat(drugs: ExtractedDrugData[]) {\n  const categorizedDrugs: Record<string, any[]> = {};\n\n  drugs.forEach(drug => {\n    const categoryKey = getCategoryKey(drug.category);\n    if (!categorizedDrugs[categoryKey]) {\n      categorizedDrugs[categoryKey] = [];\n    }\n\n    categorizedDrugs[categoryKey].push({\n      id: generateDrugId(drug.name, categoryKey),\n      name: drug.name,\n      genericName: drug.genericName || drug.name,\n      brandNames: drug.brandNames || '',\n      contraindications: drug.contraindications || '',
      sideEffects: drug.sideEffects || '',
      precautions: drug.precautions || '',
      dosageInfo: drug.dosageInfo
    });
  });

  return categorizedDrugs;
}

/**
 * Get category key from category name
 */
function getCategoryKey(categoryName: string): string {
  const categoryMap: Record<string, string> = {
    'Growth and Development': 'growth',
    'Behavioral and Psychiatric Disorders': 'behavioral',
    'Learning Disorders': 'learning',
    'Children with Special Needs': 'specialNeeds',
    'Nutrition': 'nutrition',
    'Fluid, Electrolyte, and Acid–Base Disorders': 'fluidElectrolyte',
    'Pediatric Drug Therapy': 'drugTherapy',
    'The Acutely Ill Child': 'acutelyIll',
    'Genetics and Metabolic Disorders': 'genetics',
    'Adolescent Medicine': 'adolescent',
    'Immunology': 'immunology',
    'Allergic Disorders': 'allergic',
    'Rheumatic Diseases': 'rheumatic',
    'Infectious Diseases': 'infectious',
    'Digestive System': 'digestive',
    'Respiratory System': 'respiratory',
    'Cardiovascular System': 'cardiovascular',
    'Blood (Hematology)': 'hematology',
    'Kidneys and Urinary Tract (Nephrology & Urology)': 'nephrology',
    'Endocrinology': 'endocrinology',
    'Neurology': 'neurology',
    'Ophthalmology': 'ophthalmology',
    'Ear, Nose, and Throat (ENT)': 'ent',
    'Skin (Dermatology)': 'dermatology',
    'Bone and Joint Disorders (Orthopedics)': 'orthopedics',
    'Rehabilitation and Chronic Care': 'rehabilitation',
    'Environmental Health': 'environmental'
  };

  return categoryMap[categoryName] || categoryName.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generate unique drug ID
 */
function generateDrugId(drugName: string, category: string): string {
  return `${category}-${drugName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

/**
 * Process extracted drugs and save to application format
 */
export async function processAndSaveDrugs(extractedDrugs: ExtractedDrugData[], outputPath: string = '/home/z/my-project/src/data/pediatricDrugs.ts') {
  try {
    // Clean and validate drugs
    const cleanedDrugs = extractedDrugs.map(cleanDrugData);
    const validDrugs = cleanedDrugs.filter(validateDrugData);
    
    console.log(`Processed ${validDrugs.length} valid drugs out of ${extractedDrugs.length} extracted drugs`);
    
    // Convert to app format
    const appFormatDrugs = convertToAppFormat(validDrugs);
    
    // Generate TypeScript file content
    const fileContent = generateTypeScriptFile(appFormatDrugs);
    
    // Save to file
    fs.writeFileSync(outputPath, fileContent, 'utf8');
    
    console.log(`Successfully saved processed drugs to ${outputPath}`);
    return appFormatDrugs;
  } catch (error) {
    console.error('Error processing and saving drugs:', error);
    throw error;
  }
}

/**
 * Generate TypeScript file content from processed drugs
 */
function generateTypeScriptFile(categorizedDrugs: Record<string, any[]>): string {
  const categories = Object.keys(categorizedDrugs);
  
  let content = `// Comprehensive Pediatric Drug Database\n// Extracted from Nelson Textbook of Pediatrics DOCX files\n// Generated on ${new Date().toISOString()}\n\nexport const pediatricDrugs = {\n`;
  
  categories.forEach(category => {
    content += `  // ${getCategoryName(category)}\n  ${category}: [\n`;
    
    categorizedDrugs[category].forEach((drug, index) => {
      content += `    {\n`;
      content += `      id: '${drug.id}',\n`;
      content += `      name: '${drug.name.replace(/'/g, "\\'")}',\n`;
      content += `      genericName: '${drug.genericName.replace(/'/g, "\\'")}',\n`;
      content += `      brandNames: '${drug.brandNames.replace(/'/g, "\\'")}',\n`;
      content += `      indications: '${drug.indications.replace(/'/g, "\\'")}',\n`;
      content += `      contraindications: '${drug.contraindications.replace(/'/g, "\\'")}',\n`;
      content += `      sideEffects: '${drug.sideEffects.replace(/'/g, "\\'")}',\n`;
      content += `      precautions: '${drug.precautions.replace(/'/g, "\\'")}',\n`;
      content += `      dosageInfo: [\n`;
      
      drug.dosageInfo.forEach((dosage: any) => {
        content += `        {\n`;
        content += `          ageGroup: '${dosage.ageGroup.replace(/'/g, "\\'")}',\n`;
        content += `          weightRange: '${dosage.weightRange.replace(/'/g, "\\'")}',\n`;
        content += `          dosage: '${dosage.dosage.replace(/'/g, "\\'")}',\n`;
        content += `          frequency: '${dosage.frequency.replace(/'/g, "\\'")}',\n`;
        content += `          route: '${dosage.route.replace(/'/g, "\\'")}',\n`;
        if (dosage.maxDailyDose) {
          content += `          maxDailyDose: '${dosage.maxDailyDose.replace(/'/g, "\\'")}'\n`;
        } else {
          content += `          maxDailyDose: undefined\n`;
        }
        content += `        },\n`;
      });
      
      content += `      ]\n`;
      content += `    }${index < categorizedDrugs[category].length - 1 ? ',' : ''}\n`;
    });
    
    content += `  ],\n`;
  });
  
  content += `};\n\nexport default pediatricDrugs;\n`;
  
  return content;
}

/**
 * Get category display name from category key
 */
function getCategoryName(categoryKey: string): string {
  const nameMap: Record<string, string> = {
    growth: 'Growth and Development',
    behavioral: 'Behavioral and Psychiatric Disorders',
    learning: 'Learning Disorders',
    specialNeeds: 'Children with Special Needs',
    nutrition: 'Nutrition',
    fluidElectrolyte: 'Fluid, Electrolyte, and Acid–Base Disorders',
    drugTherapy: 'Pediatric Drug Therapy',
    acutelyIll: 'The Acutely Ill Child',
    genetics: 'Genetics and Metabolic Disorders',
    adolescent: 'Adolescent Medicine',
    immunology: 'Immunology',
    allergic: 'Allergic Disorders',
    rheumatic: 'Rheumatic Diseases',
    infectious: 'Infectious Diseases',
    digestive: 'Digestive System',
    respiratory: 'Respiratory System',
    cardiovascular: 'Cardiovascular System',
    hematology: 'Blood (Hematology)',
    nephrology: 'Kidneys and Urinary Tract (Nephrology & Urology)',
    endocrinology: 'Endocrinology',
    neurology: 'Neurology',
    ophthalmology: 'Ophthalmology',
    ent: 'Ear, Nose, and Throat (ENT)',
    dermatology: 'Skin (Dermatology)',
    orthopedics: 'Bone and Joint Disorders (Orthopedics)',
    rehabilitation: 'Rehabilitation and Chronic Care',
    environmental: 'Environmental Health'
  };
  
  return nameMap[categoryKey] || categoryKey;
}