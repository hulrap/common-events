export interface Event {
  id: string;
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  latitude: number | null;
  longitude: number | null;
  customLocation: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  venueId: string | null;
  venueName: string | null;
  categoryId: string | null;
  isEditorsChoice: boolean;
  bannerUrl: string | null;
  shortDescription: string | null;
  description: string | null;
}
