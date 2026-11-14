import ChipGroup from "./ChipGroup";
import { COUNTRIES } from "./constants";
import FilterSection from "./FilterSection";

interface CountryFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function CountryFilter({ value, onChange }: CountryFilterProps) {
  return (
    <FilterSection title="Country">
      <ChipGroup options={COUNTRIES} selected={value} onChange={onChange} />
    </FilterSection>
  );
}
