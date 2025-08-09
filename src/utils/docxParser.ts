import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';

// Interface for extracted drug data
export interface ExtractedDrugData {
  name: string;
  genericName?: string;
  brandNames?: string;
  indications: string;
  contraindications?: string;
  sideEffects?: string;
  precautions?: string;
  dosageInfo: DosageInfo[];
  category: string;
  source: string;
}

export interface DosageInfo {
  ageGroup: string;
  weightRange: string;
  dosage: string;
  frequency: string;
  route: string;
  maxDailyDose?: string;
}

export interface ParsedTableData {
  category: string;
  drugs: ExtractedDrugData[];
  tableName: string;
  pageNumber?: number;
}

/**
 * Parse DOCX file to extract drug dosage tables using mammoth library
 */
export async function parseDocxFile(filePath: string): Promise<ParsedTableData[]> {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    console.log(`Parsing DOCX file: ${filePath}`);

    // Read the DOCX file buffer
    const buffer = fs.readFileSync(filePath);
    
    // Extract HTML content using mammoth
    const result = await mammoth.convertToHtml({ buffer });
    const html = result.value;

    // Parse the HTML to extract table data
    const parsedData = parseHtmlForDrugTables(html, filePath);

    console.log(`Extracted ${parsedData.length} table sections from ${filePath}`);
    return parsedData;
  } catch (error) {
    console.error('Error parsing DOCX file:', error);
    throw error;
  }
}

/**
 * Parse HTML content to extract drug tables
 */
function parseHtmlForDrugTables(html: string, sourceFile: string): ParsedTableData[] {
  const tables: ParsedTableData[] = [];
  
  // Simple HTML parsing to find tables
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let match;
  
  while ((match = tableRegex.exec(html)) !== null) {
    const tableHtml = match[1];
    const tableData = parseTableHtml(tableHtml, sourceFile);
    
    if (tableData.drugs.length > 0) {
      tables.push(tableData);
    }
  }
  
  return tables;
}

/**
 * Parse individual table HTML to extract drug data
 */
function parseTableHtml(tableHtml: string, sourceFile: string): ParsedTableData {
  const drugs: ExtractedDrugData[] = [];
  
  // Extract rows from table
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows: string[][] = [];
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const rowHtml = rowMatch[1];
    const cells: string[] = [];
    
    // Extract cells from row
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      // Clean cell content by removing HTML tags and extra whitespace
      const cellContent = cellMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      cells.push(cellContent);
    }
    
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  // Try to identify the category from the table content
  const category = identifyCategoryFromTable(tableHtml);
  const tableName = extractTableName(tableHtml);
  
  // Parse rows into drug data
  for (let i = 1; i < rows.length; i++) { // Skip header row
    const drug = parseRowToDrug(rows[i], category, sourceFile);
    if (drug) {
      drugs.push(drug);
    }
  }
  
  return {
    category,
    drugs,
    tableName,
    pageNumber: extractPageNumber(tableHtml)
  };
}

/**
 * Parse a table row into drug data
 */
function parseRowToDrug(row: string[], category: string, sourceFile: string): ExtractedDrugData | null {
  if (row.length < 3) return null; // Need at least some basic info
  
  try {
    // This is a simplified parsing logic - in reality, you would need more sophisticated
    // parsing based on the actual table structure from Nelson Textbook
    const name = row[0] || '';
    const genericName = row[1] || name;
    const indications = row[2] || '';
    const dosage = row[3] || '';
    
    // Extract dosage information from dosage string
    const dosageInfo = parseDosageString(dosage);
    
    return {
      name,
      genericName,
      brandNames: '',
      indications,
      contraindications: '',
      sideEffects: '',
      precautions: '',
      dosageInfo,
      category,
      source: sourceFile
    };
  } catch (error) {
    console.warn('Error parsing row:', error);
    return null;
  }
}

/**
 * Parse dosage string into structured dosage information
 */
function parseDosageString(dosageStr: string): DosageInfo[] {
  // This is a simplified parser - you would need to customize this based on
  // the actual format used in Nelson Textbook tables
  const dosageInfo: DosageInfo[] = [];
  
  // Try to extract common dosage patterns
  const patterns = [
    /(\d+(?:\.\d+)?)\s*mg\/kg\/day/i,
    /(\d+(?:\.\d+)?)\s*mg\/kg\/dose/i,
    /(\d+(?:\.\d+)?)\s*mg\/day/i,
    /(\d+(?:\.\d+)?)\s*mcg\/kg\/day/i
  ];
  
  for (const pattern of patterns) {
    const match = dosageStr.match(pattern);
    if (match) {
      dosageInfo.push({
        ageGroup: 'Children',
        weightRange: 'Varies',
        dosage: match[0],
        frequency: extractFrequency(dosageStr),
        route: extractRoute(dosageStr),
        maxDailyDose: extractMaxDose(dosageStr)
      });
      break;
    }
  }
  
  // If no pattern matched, create a basic entry
  if (dosageInfo.length === 0 && dosageStr.trim()) {
    dosageInfo.push({
      ageGroup: 'Children',
      weightRange: 'Varies',
      dosage: dosageStr,
      frequency: extractFrequency(dosageStr),
      route: extractRoute(dosageStr),
      maxDailyDose: extractMaxDose(dosageStr)
    });
  }
  
  return dosageInfo;
}

/**
 * Extract frequency from dosage string
 */
function extractFrequency(dosageStr: string): string {
  const frequencyPatterns = [
    /once\s*daily/i,
    /twice\s*daily/i,
    /three\s*times\s*daily/i,
    /every\s*(\d+)\s*hours/i,
    /q(\d+)h/i,
    /bid/i,
    /tid/i,
    /qid/i
  ];
  
  for (const pattern of frequencyPatterns) {
    const match = dosageStr.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'As directed';
}

/**
 * Extract route from dosage string
 */
function extractRoute(dosageStr: string): string {
  const routePatterns = [
    /oral/i,
    /iv/i,
    /im/i,
    /subcutaneous/i,
    /intramuscular/i,
    /intravenous/i
  ];
  
  for (const pattern of routePatterns) {
    const match = dosageStr.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return 'Oral';
}

/**
 * Extract maximum dose from dosage string
 */
function extractMaxDose(dosageStr: string): string | undefined {
  const maxPatterns = [
    /max\s*(\d+(?:\.\d+)?)\s*mg\/kg\/day/i,
    /maximum\s*(\d+(?:\.\d+)?)\s*mg\/day/i,
    /not\s*to\s*exceed\s*(\d+(?:\.\d+)?)\s*mg/i
  ];
  
  for (const pattern of maxPatterns) {
    const match = dosageStr.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return undefined;
}

/**
 * Identify category from table content
 */
function identifyCategoryFromTable(tableHtml: string): string {
  const content = tableHtml.toLowerCase();
  
  const categoryKeywords = {
    'Infectious Diseases': ['antibiotic', 'antimicrobial', 'infection', 'bacterial', 'viral'],
    'Pediatric Drug Therapy': ['analgesic', 'antipyretic', 'pain', 'fever'],
    'Cardiovascular System': ['cardiac', 'hypertension', 'heart', 'blood pressure'],
    'Respiratory System': ['asthma', 'bronchitis', 'pulmonary', 'respiratory'],
    'Nutrition': ['vitamin', 'mineral', 'nutrition', 'supplement'],
    'Endocrinology': ['diabetes', 'thyroid', 'hormone', 'endocrine'],
    'Neurology': ['seizure', 'epilepsy', 'neurological', 'migraine'],
    'Growth and Development': ['growth', 'hormone', 'development'],
    'Fluid, Electrolyte, and Acid–Base Disorders': ['electrolyte', 'fluid', 'hydration'],
    'The Acutely Ill Child': ['emergency', 'acute', 'critical'],
    'Genetics and Metabolic Disorders': ['metabolic', 'genetic', 'enzyme'],
    'Adolescent Medicine': ['adolescent', 'puberty', 'contraceptive'],
    'Immunology': ['immunoglobulin', 'immune', 'allergy'],
    'Allergic Disorders': ['allergy', 'antihistamine', 'allergic'],
    'Rheumatic Diseases': ['arthritis', 'rheumatic', 'joint'],
    'Digestive System': ['gi', 'gastrointestinal', 'digestive', 'liver'],
    'Blood (Hematology)': ['anemia', 'blood', 'hematology', 'coagulation'],
    'Kidneys and Urinary Tract (Nephrology & Urology)': ['renal', 'kidney', 'urinary', 'nephrology'],
    'Ophthalmology': ['eye', 'ophthalmic', 'vision'],
    'Ear, Nose, and Throat (ENT)': ['ent', 'ear', 'nose', 'throat'],
    'Skin (Dermatology)': ['skin', 'dermatologic', 'rash'],
    'Bone and Joint Disorders (Orthopedics)': ['bone', 'orthopedic', 'musculoskeletal'],
    'Rehabilitation and Chronic Care': ['rehabilitation', 'chronic', 'therapy'],
    'Environmental Health': ['toxicology', 'poisoning', 'environmental'],
    'Behavioral and Psychiatric Disorders': ['adhd', 'psychiatric', 'behavioral'],
    'Learning Disorders': ['learning', 'cognitive', 'developmental'],
    'Children with Special Needs': ['special', 'disability', 'cerebral palsy']
  };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'General';
}

/**
 * Extract table name from HTML
 */
function extractTableName(tableHtml: string): string {
  // Look for heading before table or caption within table
  const headingMatch = tableHtml.match(/<h[1-6][^>]*>([^<]*)<\/h[1-6]>/i);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  const captionMatch = tableHtml.match(/<caption[^>]*>([^<]*)<\/caption>/i);
  if (captionMatch) {
    return captionMatch[1].trim();
  }
  
  return 'Drug Dosage Table';
}

/**
 * Extract page number from HTML
 */
function extractPageNumber(tableHtml: string): number | undefined {
  const pageMatch = tableHtml.match(/page\s*(\d+)/i);
  if (pageMatch) {
    return parseInt(pageMatch[1]);
  }
  return undefined;
}

/**
 * Extract drug data from multiple DOCX files in a directory
 */
export async function extractDrugsFromDocxFiles(directoryPath: string): Promise<ExtractedDrugData[]> {
  try {
    if (!fs.existsSync(directoryPath)) {
      throw new Error(`Directory not found: ${directoryPath}`);
    }

    const files = fs.readdirSync(directoryPath);
    const docxFiles = files.filter(file => file.endsWith('.docx') || file.endsWith('.doc'));
    
    const allDrugs: ExtractedDrugData[] = [];

    for (const file of docxFiles) {
      const filePath = path.join(directoryPath, file);
      try {
        const parsedData = await parseDocxFile(filePath);
        const drugs = parsedData.flatMap(data => data.drugs);
        allDrugs.push(...drugs);
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
      }
    }

    return allDrugs;
  } catch (error) {
    console.error('Error extracting drugs from DOCX files:', error);
    throw error;
  }
}

/**
 * Validate extracted drug data
 */
export function validateDrugData(drug: ExtractedDrugData): boolean {
  const requiredFields = ['name', 'indications', 'dosageInfo', 'category'];
  
  for (const field of requiredFields) {
    if (!drug[field as keyof ExtractedDrugData]) {
      console.warn(`Missing required field '${field}' in drug: ${drug.name}`);
      return false;
    }
  }

  if (!Array.isArray(drug.dosageInfo) || drug.dosageInfo.length === 0) {
    console.warn(`No dosage information for drug: ${drug.name}`);
    return false;
  }

  for (const dosage of drug.dosageInfo) {
    const dosageRequiredFields = ['ageGroup', 'weightRange', 'dosage', 'frequency', 'route'];
    for (const field of dosageRequiredFields) {
      if (!dosage[field as keyof DosageInfo]) {
        console.warn(`Missing required dosage field '${field}' in drug: ${drug.name}`);
        return false;
      }
    }
  }

  return true;
}

/**
 * Clean and normalize extracted drug data
 */
export function cleanDrugData(drug: ExtractedDrugData): ExtractedDrugData {
  return {
    ...drug,
    name: drug.name.trim(),
    genericName: drug.genericName?.trim(),
    brandNames: drug.brandNames?.trim(),
    indications: drug.indications.trim(),
    contraindications: drug.contraindications?.trim(),
    sideEffects: drug.sideEffects?.trim(),
    precautions: drug.precautions?.trim(),
    category: drug.category.trim(),
    dosageInfo: drug.dosageInfo.map(dosage => ({
      ...dosage,
      ageGroup: dosage.ageGroup.trim(),
      weightRange: dosage.weightRange.trim(),
      dosage: dosage.dosage.trim(),
      frequency: dosage.frequency.trim(),
      route: dosage.route.trim(),
      maxDailyDose: dosage.maxDailyDose?.trim()
    }))
  };
}

/**
 * Convert extracted drug data to the format used in the application
 */
export function convertToAppFormat(drugs: ExtractedDrugData[]) {
  const categorizedDrugs: Record<string, any[]> = {};

  drugs.forEach(drug => {
    const categoryKey = getCategoryKey(drug.category);
    if (!categorizedDrugs[categoryKey]) {
      categorizedDrugs[categoryKey] = [];
    }

    categorizedDrugs[categoryKey].push({
      id: generateDrugId(drug.name, categoryKey),
      name: drug.name,
      genericName: drug.genericName || drug.name,
      brandNames: drug.brandNames || '',
      contraindications: drug.contraindications || '',
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
      content += `      genericName: '${(drug.genericName || '').replace(/'/g, "\\'")}',\n`;
      content += `      brandNames: '${(drug.brandNames || '').replace(/'/g, "\\'")}',\n`;
      content += `      indications: '${(drug.indications || '').replace(/'/g, "\\'")}',\n`;
      content += `      contraindications: '${(drug.contraindications || '').replace(/'/g, "\\'")}',\n`;
      content += `      sideEffects: '${(drug.sideEffects || '').replace(/'/g, "\\'")}',\n`;
      content += `      precautions: '${(drug.precautions || '').replace(/'/g, "\\'")}',\n`;
      content += `      dosageInfo: [\n`;
      
      drug.dosageInfo.forEach((dosage: any) => {
        content += `        {\n`;
        content += `          ageGroup: '${(dosage.ageGroup || '').replace(/'/g, "\\'")}',\n`;
        content += `          weightRange: '${(dosage.weightRange || '').replace(/'/g, "\\'")}',\n`;
        content += `          dosage: '${(dosage.dosage || '').replace(/'/g, "\\'")}',\n`;
        content += `          frequency: '${(dosage.frequency || '').replace(/'/g, "\\'")}',\n`;
        content += `          route: '${(dosage.route || '').replace(/'/g, "\\'")}',\n`;
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