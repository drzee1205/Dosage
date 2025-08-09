import { NextRequest, NextResponse } from 'next/server'

interface DosageCalculationRequest {
  drugName: string
  patientWeight: number
  patientAge?: string
  dosagePerKg: number
  frequency: string
  route: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DosageCalculationRequest = await request.json()
    
    const { drugName, patientWeight, dosagePerKg, frequency, route } = body
    
    // Calculate dosage
    const dosagePerDose = patientWeight * dosagePerKg
    const dailyDosage = dosagePerDose * getFrequencyMultiplier(frequency)
    
    // Calculate common concentrations and volumes
    const concentrations = [
      { strength: '80mg/5mL', volumePerDose: dosagePerDose / 16 },
      { strength: '160mg/5mL', volumePerDose: dosagePerDose / 32 },
      { strength: '325mg/5mL', volumePerDose: dosagePerDose / 65 },
      { strength: '100mg/mL', volumePerDose: dosagePerDose / 100 }
    ]
    
    // Safety checks
    const maxDailyDose = getMaxDailyDose(drugName, patientWeight)
    const isOverMaxDaily = dailyDosage > maxDailyDose
    const isOverSingleDose = dosagePerDose > getMaxSingleDose(drugName, patientWeight)
    
    const result = {
      drugName,
      patientWeight,
      dosagePerDose: Math.round(dosagePerDose * 10) / 10,
      dailyDosage: Math.round(dailyDosage * 10) / 10,
      frequency,
      route,
      concentrations: concentrations.map(c => ({
        ...c,
        volumePerDose: Math.round(c.volumePerDose * 10) / 10
      })),
      safetyChecks: {
        maxDailyDose,
        isOverMaxDaily,
        isOverSingleDose,
        warnings: generateWarnings(drugName, dosagePerDose, dailyDosage, patientWeight)
      },
      notes: generateNotes(drugName, patientWeight, dosagePerDose)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

function getFrequencyMultiplier(frequency: string): number {
  const frequencyMap: Record<string, number> = {
    'Every 4 hours': 6,
    'Every 6 hours': 4,
    'Every 8 hours': 3,
    'Every 12 hours': 2,
    'Every 24 hours': 1,
    'Three times daily': 3,
    'Twice daily': 2,
    'Once daily': 1
  }
  return frequencyMap[frequency] || 1
}

function getMaxDailyDose(drugName: string, weight: number): number {
  const drugLimits: Record<string, number> = {
    'Acetaminophen': Math.min(4000, weight * 75),
    'Ibuprofen': Math.min(2400, weight * 40),
    'Amoxicillin': Math.min(3000, weight * 90)
  }
  return drugLimits[drugName] || 1000
}

function getMaxSingleDose(drugName: string, weight: number): number {
  const drugLimits: Record<string, number> = {
    'Acetaminophen': Math.min(1000, weight * 15),
    'Ibuprofen': Math.min(800, weight * 10),
    'Amoxicillin': Math.min(1000, weight * 45)
  }
  return drugLimits[drugName] || 500
}

function generateWarnings(drugName: string, dosagePerDose: number, dailyDosage: number, weight: number): string[] {
  const warnings: string[] = []
  
  if (drugName === 'Acetaminophen') {
    if (dailyDosage > 4000) {
      warnings.push('Daily dose exceeds maximum recommended adult dose of 4000mg')
    }
    if (weight < 10 && dosagePerDose > 160) {
      warnings.push('High dose for low body weight - consult pediatrician')
    }
  }
  
  if (drugName === 'Ibuprofen') {
    if (weight < 6) {
      warnings.push('Ibuprofen not recommended for children under 6 months')
    }
    if (dailyDosage > 2400) {
      warnings.push('Daily dose exceeds maximum recommended dose')
    }
  }
  
  return warnings
}

function generateNotes(drugName: string, weight: number, dosagePerDose: number): string[] {
  const notes: string[] = []
  
  notes.push('Always use the measuring device that comes with the medication')
  notes.push('Shake liquid medications well before use')
  
  if (drugName === 'Acetaminophen') {
    notes.push('Do not exceed 5 doses in 24 hours')
    notes.push('Consult healthcare provider if fever persists for more than 3 days')
  }
  
  if (drugName === 'Ibuprofen') {
    notes.push('Give with food or milk to reduce stomach upset')
    notes.push('Do not give to children with dehydration or kidney problems')
  }
  
  return notes
}