import { BOOKS } from "../../data";
import { Filters } from "../types";

export interface DateRange {
  key: string;
  label: string;
  min?: number; // inclusive year
  max?: number; // inclusive year
}

export const DATE_RANGES: DateRange[] = [
  { key: "any", label: "Any time" },
  { key: "before-2000", label: "Before 2000", max: 1999 },
  { key: "2000-2009", label: "2000–2009", min: 2000, max: 2009 },
  { key: "2010-2014", label: "2010–2014", min: 2010, max: 2014 },
  { key: "2015-2019", label: "2015–2019", min: 2015, max: 2019 },
  { key: "2020-plus", label: "2020 & later", min: 2020 },
];

const unique = (values: string[]) => Array.from(new Set(values)).sort();

// Options are built from the data, so they always match what's in the catalog
export const COUNTRIES = unique(BOOKS.map((b) => b.country));
export const LANGUAGES = unique(BOOKS.map((b) => b.language));
export const SUBJECT_OPTIONS = unique(BOOKS.map((b) => b.subject));

export const DEFAULT_FILTERS: Filters = {
  dateRange: "any",
  countries: [],
  languages: [],
  subjects: [],
  minPrice: "",
  maxPrice: "",
};
