interface EquipmentFormData {
  name: string
  code: string
  description: string
  capacity: number | null
  category: string
  imageUrl: string
  status: 'available' | 'in_use' | 'maintenance'
}

interface Equipment extends EquipmentFormData {
  id: string
}

interface EquipmentFormErrors {
  name?: string
  code?: string
  capacity?: string
  category?: string
}