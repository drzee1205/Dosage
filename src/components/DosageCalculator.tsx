"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calculator, AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface DosageResult {
  drugName: string
  patientWeight: number
  dosagePerDose: number
  dailyDosage: number
  frequency: string
  route: string
  concentrations: Array<{
    strength: string
    volumePerDose: number
  }>
  safetyChecks: {
    maxDailyDose: number
    isOverMaxDaily: boolean
    isOverSingleDose: boolean
    warnings: string[]
  }
  notes: string[]
}

export default function DosageCalculator() {
  const [drugName, setDrugName] = useState('')
  const [patientWeight, setPatientWeight] = useState('')
  const [patientAge, setPatientAge] = useState('')
  const [dosagePerKg, setDosagePerKg] = useState('')
  const [frequency, setFrequency] = useState('')
  const [route, setRoute] = useState('')
  const [result, setResult] = useState<DosageResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const commonDrugs = [
    { name: 'Acetaminophen', defaultDosage: 15 },
    { name: 'Ibuprofen', defaultDosage: 7.5 },
    { name: 'Amoxicillin', defaultDosage: 40 }
  ]

  const frequencies = [
    'Every 4 hours',
    'Every 6 hours', 
    'Every 8 hours',
    'Every 12 hours',
    'Every 24 hours',
    'Three times daily',
    'Twice daily',
    'Once daily'
  ]

  const routes = [
    'Oral',
    'Intravenous',
    'Intramuscular',
    'Subcutaneous',
    'Topical',
    'Rectal'
  ]

  const calculateDosage = async () => {
    if (!drugName || !patientWeight || !dosagePerKg || !frequency || !route) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/calculate-dosage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drugName,
          patientWeight: parseFloat(patientWeight),
          patientAge,
          dosagePerKg: parseFloat(dosagePerKg),
          frequency,
          route
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error calculating dosage:', error)
      alert('Error calculating dosage. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const selectCommonDrug = (drug: typeof commonDrugs[0]) => {
    setDrugName(drug.name)
    setDosagePerKg(drug.defaultDosage.toString())
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Pediatric Dosage Calculator
          </CardTitle>
          <CardDescription>
            Calculate accurate pediatric dosages based on weight and standard dosing guidelines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Common Drugs Quick Select */}
          <div>
            <label className="text-sm font-medium mb-2 block">Common Drugs</label>
            <div className="flex flex-wrap gap-2">
              {commonDrugs.map((drug) => (
                <Button
                  key={drug.name}
                  variant="outline"
                  size="sm"
                  onClick={() => selectCommonDrug(drug)}
                  className="text-xs"
                >
                  {drug.name} ({drug.defaultDosage}mg/kg)
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Drug Name *</label>
              <Input
                placeholder="Enter drug name"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Weight (kg) *</label>
              <Input
                type="number"
                placeholder="Enter weight in kg"
                value={patientWeight}
                onChange={(e) => setPatientWeight(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Age</label>
              <Input
                placeholder="e.g., 5 years, 6 months"
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dosage (mg/kg) *</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Enter dosage per kg"
                value={dosagePerKg}
                onChange={(e) => setDosagePerKg(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency *</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map((freq) => (
                    <SelectItem key={freq} value={freq}>
                      {freq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Route *</label>
              <Select value={route} onValueChange={setRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  {routes.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={calculateDosage} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Calculating...' : 'Calculate Dosage'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Dosage Calculation Results
            </CardTitle>
            <CardDescription>
              {result.drugName} for {result.patientWeight}kg patient
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Dose per Administration</div>
                <div className="text-2xl font-bold text-blue-800">{result.dosagePerDose}mg</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Daily Total</div>
                <div className="text-2xl font-bold text-green-800">{result.dailyDosage}mg</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Frequency</div>
                <div className="text-lg font-bold text-purple-800">{result.frequency}</div>
              </div>
            </div>

            {/* Safety Alerts */}
            {(result.safetyChecks.isOverMaxDaily || result.safetyChecks.isOverSingleDose || result.safetyChecks.warnings.length > 0) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    {result.safetyChecks.isOverMaxDaily && (
                      <div className="text-red-600 font-medium">
                        ⚠️ Daily dose exceeds maximum recommended dose of {result.safetyChecks.maxDailyDose}mg
                      </div>
                    )}
                    {result.safetyChecks.isOverSingleDose && (
                      <div className="text-red-600 font-medium">
                        ⚠️ Single dose exceeds recommended maximum
                      </div>
                    )}
                    {result.safetyChecks.warnings.map((warning, index) => (
                      <div key={index} className="text-yellow-700">
                        ⚠️ {warning}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Concentration Table */}
            <div>
              <h4 className="font-semibold mb-3">Liquid Concentrations & Volumes</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">Concentration</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Volume per Dose</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Daily Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.concentrations.map((conc, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">{conc.strength}</td>
                        <td className="border border-gray-300 px-4 py-2">{conc.volumePerDose}mL</td>
                        <td className="border border-gray-300 px-4 py-2">
                          {(conc.volumePerDose * (result.dailyDosage / result.dosagePerDose)).toFixed(1)}mL
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Notes */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Important Notes
              </h4>
              <div className="space-y-2">
                {result.notes.map((note, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{note}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <strong>Medical Disclaimer:</strong> This calculator is for educational purposes only. 
                Always consult with a qualified healthcare professional before administering any medication. 
                Dosages should be verified with appropriate medical references and healthcare providers.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}