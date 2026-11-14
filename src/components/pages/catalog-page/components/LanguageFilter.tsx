import ChipGroup from "./ChipGroup";
import { LANGUAGES } from "./constants";
import FilterSection from "./FilterSection";

interface LanguageFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function LanguageFilter({
  value,
  onChange,
}: LanguageFilterProps) {
  return (
    <FilterSection title="Language">
      <ChipGroup options={LANGUAGES} selected={value} onChange={onChange} />
    </FilterSection>
  );
}
