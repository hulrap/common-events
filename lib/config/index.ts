import venuesData from "@/config/venues.json";
import categoriesData from "@/config/categories.json";
import eventTagsData from "@/config/event-tags.json";
import currenciesData from "@/config/currencies.json";
import citiesData from "@/config/cities.json";

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city: string;
  country: string;
  tags?: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  default?: boolean;
}

export const venues: Venue[] = venuesData;
export const categories: Category[] = categoriesData;
export const cities: City[] = citiesData;
export const eventTags: string[] = eventTagsData;
export const currencies: Currency[] = currenciesData;

const foundDefault = currencies.find((c) => c.default);
export const defaultCurrency = foundDefault ?? currencies[0];
export const defaultCountry = "Austria";
export const defaultCity = "Vienna";

