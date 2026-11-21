import { useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMenu } from '../../data/MenuContext.jsx';

export default function CampusSearch() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  return <SearchForm key={query} initialQuery={query} />;
}

function SearchForm({ initialQuery }) {
  const navigate = useNavigate();
  const { menu, loading, error } = useMenu();
  const listId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const term = query.trim().toLowerCase();
  const matches = term ? menu.flatMap((item) => {
    if (item.archived) return [];
    const name = item.name.toLowerCase();
    const index = name.indexOf(term);
    if (index < 0) return [];
    const rank = index === 0 ? 0 : /\s/.test(name[index - 1]) ? 1 : 2;
    return [{ item, index, rank }];
  }).sort((first, second) => first.rank - second.rank).slice(0, 6) : [];
  const showSuggestions = open && Boolean(term);
  const activeIndex = matches.findIndex(({ item }) => item.id === activeId);

  function handleKeyDown(event) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape' && showSuggestions) {
      event.preventDefault();
      setOpen(false);
      setActiveId(null);
    }
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && matches.length) {
      event.preventDefault();
      const index = event.key === 'ArrowDown'
        ? (activeIndex + 1) % matches.length
        : (activeIndex <= 0 ? matches.length - 1 : activeIndex - 1);
      setOpen(true);
      setActiveId(matches[index].item.id);
    }
  }

  function submit(event) {
    event.preventDefault();
    setOpen(false);
    setActiveId(null);
    if (showSuggestions && activeIndex >= 0) {
      navigate(`/drink/${matches[activeIndex].item.id}`);
      return;
    }
    navigate(term ? `/cafes?${new URLSearchParams({ q: query.trim() })}` : '/cafes');
  }

  return (
    <form className="campus-search" role="search" onSubmit={submit} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        setOpen(false);
        setActiveId(null);
      }
    }}>
      <button aria-label="Search menu" type="submit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg></button>
      <input name="q" type="search" value={query} placeholder="Search drinks & snacks"
        aria-label="Search drinks and snacks" enterKeyHint="search" autoComplete="off"
        role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions}
        aria-controls={showSuggestions ? listId : undefined}
        aria-activedescendant={showSuggestions && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} onChange={(event) => {
          setQuery(event.target.value);
          setActiveId(null);
          setOpen(true);
        }} />
      {showSuggestions && <div className="campus-suggestions">
        <div role="listbox" id={listId} aria-label="Matching menu items">
          {matches.map(({ item, index: matchStart }, index) => (
            <Link key={item.id} id={`${listId}-${index}`} role="option" tabIndex={-1}
              aria-selected={index === activeIndex} to={`/drink/${item.id}`}
              onClick={() => setOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg>
              <span className="suggestion-copy">
                <span>{item.name.slice(0, matchStart)}<strong>{item.name.slice(matchStart, matchStart + term.length)}</strong>{item.name.slice(matchStart + term.length)}</span>
                {item.cafe && <small>{item.cafe}</small>}
              </span>
            </Link>
          ))}
        </div>
        {matches.length === 0 && <p role="status">{loading ? 'Loading menu…' : error ? 'Menu unavailable.' : 'No matching menu items.'}</p>}
      </div>}
    </form>
  );
}
