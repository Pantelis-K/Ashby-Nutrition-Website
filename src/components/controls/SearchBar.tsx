interface SearchBarProps {
  value: string;
  hasNoResults: boolean;
  onChange: (value: string) => void;
}

export function SearchBar({ value, hasNoResults, onChange }: SearchBarProps) {
  return (
    <div className="search-block">
      <label>
        <span>Search foods</span>
        <input
          type="search"
          placeholder="Try chicken breast, skyr, lentils..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <p className={`inline-feedback ${hasNoResults ? 'is-error' : ''}`}>
        {hasNoResults ? 'No matching food found.' : 'Search is case-insensitive and supports partial matches.'}
      </p>
    </div>
  );
}
