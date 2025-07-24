interface FacilityFormData {
  name: string
  code: string
  description: string
  capacity: number | null
  category: string
  imageUrl: string
  status: 'available' | 'in_use' | 'maintenance'
}

interface Facility extends FacilityFormData {
  id: string
}

interface FacilityFormErrors {
  name?: string
  code?: string
  capacity?: string
  category?: string
}