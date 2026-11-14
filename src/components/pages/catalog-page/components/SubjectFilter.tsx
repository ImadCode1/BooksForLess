import ChipGroup from "./ChipGroup";
import { SUBJECT_OPTIONS } from "./constants";
import FilterSection from "./FilterSection";

interface SubjectFilterProps {
  value: string[];
  onChange: (next: string[]) => void;
}

export default function SubjectFilter({ value, onChange }: SubjectFilterProps) {
  return (
    <FilterSection title="Subject">
      <ChipGroup
        options={SUBJECT_OPTIONS}
        selected={value}
        onChange={onChange}
      />
    </FilterSection>
  );
}
