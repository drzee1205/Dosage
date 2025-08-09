"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, Calculator, AlertTriangle, Info } from 'lucide-react'
import DosageCalculator from '@/components/DosageCalculator'
import { getAllDrugs, getDrugsByCategory, searchDrugs } from '@/data/pediatricDrugs'

const medicalCategories = [
  { id: 'growth', name: 'Growth and Development', description: 'Drugs affecting growth and development' },
  { id: 'behavioral', name: 'Behavioral and Psychiatric Disorders', description: 'Medications for behavioral and psychiatric conditions' },
  { id: 'learning', name: 'Learning Disorders', description: 'Drugs for learning and cognitive disorders' },
  { id: 'specialNeeds', name: 'Children with Special Needs', description: 'Medications for children with special healthcare needs' },
  { id: 'nutrition', name: 'Nutrition', description: 'Nutritional supplements and feeding support' },
  { id: 'fluidElectrolyte', name: 'Fluid, Electrolyte, and Acid–Base Disorders', description: 'Fluid and electrolyte management' },
  { id: 'drugTherapy', name: 'Pediatric Drug Therapy', description: 'General pediatric medication management' },
  { id: 'acutelyIll', name: 'The Acutely Ill Child', description: 'Medications for acute pediatric illnesses' },
  { id: 'genetics', name: 'Genetics and Metabolic Disorders', description: 'Drugs for genetic and metabolic conditions' },
  { id: 'adolescent', name: 'Adolescent Medicine', description: 'Medications specific to adolescent care' },
  { id: 'immunology', name: 'Immunology', description: 'Immunomodulators and immunosuppressants' },
  { id: 'allergic', name: 'Allergic Disorders', description: 'Antihistamines and allergy medications' },
  { id: 'rheumatic', name: 'Rheumatic Diseases', description: 'Medications for rheumatic conditions' },
  { id: 'infectious', name: 'Infectious Diseases', description: 'Antibiotics and antivirals' },
  { id: 'digestive', name: 'Digestive System', description: 'Gastrointestinal medications' },
  { id: 'respiratory', name: 'Respiratory System', description: 'Respiratory medications' },
  { id: 'cardiovascular', name: 'Cardiovascular System', description: 'Cardiac and circulatory medications' },
  { id: 'hematology', name: 'Blood (Hematology)', description: 'Hematologic medications' },
  { id: 'nephrology', name: 'Kidneys and Urinary Tract (Nephrology & Urology)', description: 'Renal and urologic medications' },
  { id: 'endocrinology', name: 'Endocrinology', description: 'Hormonal medications' },
  { id: 'neurology', name: 'Neurology', description: 'Neurologic medications' },
  { id: 'ophthalmology', name: 'Ophthalmology', description: 'Eye medications' },
  { id: 'ent', name: 'Ear, Nose, and Throat (ENT)', description: 'ENT medications' },
  { id: 'dermatology', name: 'Skin (Dermatology)', description: 'Dermatologic medications' },
  { id: 'orthopedics', name: 'Bone and Joint Disorders (Orthopedics)', description: 'Musculoskeletal medications' },
  { id: 'rehabilitation', name: 'Rehabilitation and Chronic Care', description: 'Rehabilitation medications' },
  { id: 'environmental', name: 'Environmental Health', description: 'Environmental exposure treatments' }
]

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDrug, setSelectedDrug] = useState<any>(null)
  const [showCalculator, setShowCalculator] = useState(false)

  // Get drugs based on search term
  const filteredDrugs = searchTerm ? searchDrugs(searchTerm) : getAllDrugs()
  
  // Get drugs for selected category
  const categoryDrugs = selectedCategory ? getDrugsByCategory(selectedCategory) : []

  // Determine which drugs to display
  const displayDrugs = selectedCategory ? categoryDrugs : filteredDrugs

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Pediatric Drug Reference</h1>
            <p className="text-xl text-muted-foreground">
              Comprehensive dosage information based on Nelson Textbook of Pediatrics
            </p>
            <p className="text-sm text-muted-foreground">
              {getAllDrugs().length} drugs across {medicalCategories.length} medical categories
            </p>
          </div>

          {/* Search and Tools */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drugs by name, generic name, brand names, or indications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calculator className="h-4 w-4 mr-2" />
                    Dosage Calculator
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Dosage Calculator</DialogTitle>
                    <DialogDescription>
                      Calculate accurate pediatric dosages based on weight and standard guidelines
                    </DialogDescription>
                  </DialogHeader>
                  <DosageCalculator />
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Interactions
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">Browse by Category</TabsTrigger>
              <TabsTrigger value="drugs">All Drugs</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {medicalCategories.map((category) => {
                  const drugCount = getDrugsByCategory(category.id).length
                  return (
                    <Card 
                      key={category.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedCategory === category.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedCategory(selectedCategory === category.id ? '' : category.id)}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="secondary">{drugCount} drugs</Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Show drugs in selected category */}
              {selectedCategory && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Drugs in {medicalCategories.find(c => c.id === selectedCategory)?.name}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Drug List */}
                    <div className="space-y-4">
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {categoryDrugs.map((drug) => (
                          <Card 
                            key={drug.id} 
                            className={`cursor-pointer transition-colors ${
                              selectedDrug?.id === drug.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedDrug(drug)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-semibold">{drug.name}</h4>
                                  <p className="text-sm text-muted-foreground">{drug.genericName}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{drug.brandNames}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {drug.indications.substring(0, 30)}...
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Drug Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Drug Details</h3>
                      {selectedDrug ? (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              {selectedDrug.name}
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription>
                              {selectedDrug.genericName} • {selectedDrug.brandNames}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Indications</h4>
                              <p className="text-sm">{selectedDrug.indications}</p>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Contraindications</h4>
                              <p className="text-sm">{selectedDrug.contraindications}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Dosage Information</h4>
                              <div className="space-y-3">
                                {selectedDrug.dosageInfo.map((dosage: any, index: number) => (
                                  <div key={index} className="bg-muted/50 p-3 rounded-lg">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="font-medium">Age:</span> {dosage.ageGroup}
                                      </div>
                                      <div>
                                        <span className="font-medium">Weight:</span> {dosage.weightRange}
                                      </div>
                                      <div>
                                        <span className="font-medium">Dosage:</span> {dosage.dosage}
                                      </div>
                                      <div>
                                        <span className="font-medium">Frequency:</span> {dosage.frequency}
                                      </div>
                                      <div>
                                        <span className="font-medium">Route:</span> {dosage.route}
                                      </div>
                                      {dosage.maxDailyDose && (
                                        <div>
                                          <span className="font-medium">Max Daily:</span> {dosage.maxDailyDose}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Side Effects</h4>
                              <p className="text-sm">{selectedDrug.sideEffects}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold text-sm mb-2">Precautions</h4>
                              <p className="text-sm">{selectedDrug.precautions}</p>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline" onClick={() => setShowCalculator(true)}>
                                <Calculator className="h-4 w-4 mr-2" />
                                Calculate Dose
                              </Button>
                              <Button size="sm" variant="outline">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Check Interactions
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center text-muted-foreground">
                            Select a drug to view detailed information
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="drugs" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Drug List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Available Drugs ({displayDrugs.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {displayDrugs.map((drug) => (
                      <Card 
                        key={drug.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedDrug?.id === drug.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedDrug(drug)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{drug.name}</h4>
                              <p className="text-sm text-muted-foreground">{drug.genericName}</p>
                              <p className="text-xs text-muted-foreground mt-1">{drug.brandNames}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {drug.indications.substring(0, 30)}...
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Drug Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Drug Details</h3>
                  {selectedDrug ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {selectedDrug.name}
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                        <CardDescription>
                          {selectedDrug.genericName} • {selectedDrug.brandNames}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Indications</h4>
                          <p className="text-sm">{selectedDrug.indications}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Contraindications</h4>
                          <p className="text-sm">{selectedDrug.contraindications}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">Dosage Information</h4>
                          <div className="space-y-3">
                            {selectedDrug.dosageInfo.map((dosage: any, index: number) => (
                              <div key={index} className="bg-muted/50 p-3 rounded-lg">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="font-medium">Age:</span> {dosage.ageGroup}
                                  </div>
                                  <div>
                                    <span className="font-medium">Weight:</span> {dosage.weightRange}
                                  </div>
                                  <div>
                                    <span className="font-medium">Dosage:</span> {dosage.dosage}
                                  </div>
                                  <div>
                                    <span className="font-medium">Frequency:</span> {dosage.frequency}
                                  </div>
                                  <div>
                                    <span className="font-medium">Route:</span> {dosage.route}
                                  </div>
                                  {dosage.maxDailyDose && (
                                    <div>
                                      <span className="font-medium">Max Daily:</span> {dosage.maxDailyDose}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">Side Effects</h4>
                          <p className="text-sm">{selectedDrug.sideEffects}</p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">Precautions</h4>
                          <p className="text-sm">{selectedDrug.precautions}</p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="outline" onClick={() => setShowCalculator(true)}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Calculate Dose
                          </Button>
                          <Button size="sm" variant="outline">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Check Interactions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="p-8 text-center text-muted-foreground">
                        Select a drug to view detailed information
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}