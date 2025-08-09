import { NextRequest, NextResponse } from 'next/server'

// Sample drug data - in a real application, this would come from a database
const drugs = [
  {
    id: '1',
    name: 'Acetaminophen',
    genericName: 'Paracetamol',
    brandNames: 'Tylenol, Panadol',
    category: 'analgesic',
    indications: 'Fever, mild to moderate pain',
    contraindications: 'Liver disease, hypersensitivity',
    sideEffects: 'Rare: liver toxicity at high doses',
    precautions: 'Monitor liver function in prolonged use',
    dosageInfo: [
      {
        ageGroup: 'Infants < 3 months',
        weightRange: '4-6 kg',
        dosage: '10-15 mg/kg/dose',
        frequency: 'Every 6-8 hours',
        route: 'Oral',
        maxDailyDose: '60 mg/kg/day'
      },
      {
        ageGroup: 'Children 3 months - 12 years',
        weightRange: '6-40 kg',
        dosage: '10-15 mg/kg/dose',
        frequency: 'Every 4-6 hours',
        route: 'Oral',
        maxDailyDose: '75 mg/kg/day'
      }
    ]
  },
  {
    id: '2',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    brandNames: 'Advil, Motrin',
    category: 'nsaid',
    indications: 'Fever, inflammation, pain',
    contraindications: 'GI bleeding, renal impairment, aspirin allergy',
    sideEffects: 'GI upset, renal effects',
    precautions: 'Use with food, monitor renal function',
    dosageInfo: [
      {
        ageGroup: 'Children 6 months - 12 years',
        weightRange: '6-40 kg',
        dosage: '5-10 mg/kg/dose',
        frequency: 'Every 6-8 hours',
        route: 'Oral',
        maxDailyDose: '40 mg/kg/day'
      }
    ]
  },
  {
    id: '3',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brandNames: 'Amoxil, Augmentin',
    category: 'antibiotic',
    indications: 'Bacterial infections, otitis media, strep throat',
    contraindications: 'Penicillin allergy',
    sideEffects: 'Diarrhea, rash, allergic reactions',
    precautions: 'Monitor for allergic reactions, complete full course',
    dosageInfo: [
      {
        ageGroup: 'Children < 40 kg',
        weightRange: 'Any',
        dosage: '25-45 mg/kg/day divided every 12 hours',
        frequency: 'Every 12 hours',
        route: 'Oral',
        maxDailyDose: '90 mg/kg/day'
      },
      {
        ageGroup: 'Children > 40 kg',
        weightRange: '> 40 kg',
        dosage: '250-500 mg every 8 hours',
        frequency: 'Every 8 hours',
        route: 'Oral',
        maxDailyDose: '1500 mg/day'
      }
    ]
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  if (query) {
    const filteredDrugs = drugs.filter(drug => 
      drug.name.toLowerCase().includes(query.toLowerCase()) ||
      drug.genericName?.toLowerCase().includes(query.toLowerCase()) ||
      drug.brandNames?.toLowerCase().includes(query.toLowerCase())
    )
    return NextResponse.json(filteredDrugs)
  }
  
  return NextResponse.json(drugs)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // In a real application, you would save this to a database
    return NextResponse.json({ message: 'Drug data received', data: body })
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}