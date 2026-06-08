/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


export interface UserProfile {
  userId: string;
  userName: string;
  userNameEng: string;
  teamName: string;
  teamNameEng: string;
  role: string;
}

export interface TestItem {
  id: string;
  category: string;
  nameKr: string;
  nameEn: string;
  specification: string;
  unit: string;
  mandatory: 'REQUIRED' | 'OPTIONAL';
  lastUpdated: string;
  status: 'Active' | 'Pending' | 'Inactive';
  productLines: string[];
  description: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'BULK_IMPORT';
  details: string;
  timestamp: string;
  user: string;
}

export interface FilterOptions {
  productLine: string;
  category: string;
  searchQuery: string;
  status: string;
  startDate: string;
  endDate: string;
}

export const PRODUCT_LINES = [
  { value: 'PCR', label: 'Passenger Car (PCR) - 승용차' },
  { value: 'LTR', label: 'Light Truck (LTR) - 경트럭' },
  { value: 'TBR', label: 'Truck & Bus (TBR) - 트럭/버스' },
  { value: 'EV', label: 'Electric Vehicle (EV) - 전기차' },
  { value: 'RAC', label: 'Racing & Motorsport - 레이싱' },
];

export const CATEGORIES = [
  'Material Strength',
  'Durability',
  'Noise & Vibration',
  'Aerodynamics',
  'Tread Pattern Strength',
  'Thermal Performance',
  'High Speed Uniformity',
  'Wet Grip Grip Performance',
];
