import { useMemo } from "react";
import {
  venues,
  categories,
  cities,
  eventTags,
  currencies,
  defaultCurrency,
  type Venue,
  type Category,
  type City,
  type Currency,
} from "@/lib/config";

export function useConfig() {
  return useMemo(
    () => ({
      venues,
      categories,
      cities,
      eventTags,
      currencies,
      defaultCurrency,
      getVenueById: (id: string): Venue | undefined => venues.find((v) => v.id === id),
      getCategoryById: (id: string): Category | undefined => categories.find((c) => c.id === id),
      getCityById: (id: string): City | undefined => cities.find((c) => c.id === id),
      getCurrencyByCode: (code: string): Currency | undefined =>
        currencies.find((c) => c.code === code),
    }),
    []
  );
}

