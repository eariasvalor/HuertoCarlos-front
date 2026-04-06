export interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  addressStreetType?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressFloor?: string;
  addressCity?: string;
  addressPostalCode?: string;
  addressProvince?: string;
}