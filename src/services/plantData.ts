export const MOCK_PLANTS = [
  {
    id: '1',
    name: 'Mușețel (Matricaria chamomilla)',
    partsUsed: 'Florile',
    benefits: 'Calmează sistemul nervos, antiinflamator, ajută digestia și somnul.',
    contraindications: 'Alergie la plante din familia Asteraceae.'
  },
  {
    id: '2',
    name: 'Gălbenele (Calendula officinalis)',
    partsUsed: 'Florile (petalele)',
    benefits: 'Cicatrizant excelent, antibacterian, tratează arsuri și răni superficiale.',
    contraindications: 'Femeile însărcinate (în uz intern).'
  },
  
];
export const MOCK_LOCATIONS = [
  { id: '1', plantId: '1', name: 'Mușețel', lat: 45.4370, lng: 28.0060 },
  { id: '2', plantId: '2', name: 'Gălbenele', lat: 45.4400, lng: 28.0150 },
  { id: '3', plantId: '1', name: 'Mușețel', lat: 45.4300, lng: 27.9950 },
];