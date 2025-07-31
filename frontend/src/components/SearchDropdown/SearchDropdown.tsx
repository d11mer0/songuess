import React, { useState, useRef } from 'react';

import { BsSearch } from 'react-icons/bs'; // додай на початку файлу
import { BsX } from 'react-icons/bs';

import styles from './SearchDropdown.module.css';

interface SearchDropdownProps<T> {
    value: string;
    setValue: (value: string) => void;
    options: T[];
    onSelect: (id: number) => void;
    optionLabel: keyof T; 
    getSubtext?: (item: T) => string; 
    autoCloseDelay?: number | false; 
    placeholder?: string;
}

const SearchDropdown = <T extends { id: number }>({
    value,
    setValue,
    options,
    onSelect,
    optionLabel,
    getSubtext,
    autoCloseDelay = false,
    placeholder = "Search ..."
}: SearchDropdownProps<T>) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const handleSelect = (id: number) => {
        onSelect(id);
        setValue('');

        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);

        if (autoCloseDelay === false) {
            setIsDropdownOpen(false);
            inputRef.current?.blur();
        } else {
            timeoutRef.current = window.setTimeout(() => {
                setIsDropdownOpen(false);
                inputRef.current?.blur();
            }, autoCloseDelay);
        }
    };

    const highlightMatch = (text: string, query: string) => {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1 || !query) return <>{text}</>;

        return (
            <>
                {text.slice(0, index)}
                <span className={styles.highlightedMatch}>
                    {text.slice(index, index + query.length)}
                </span>
                {text.slice(index + query.length)}
            </>
        );
    };

    return (
        <div className={styles.searchContainer}>
            <div className={styles.inputWrapper}>
                <span className={styles.searchIcon}>
                    <BsSearch />
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.searchInput}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                        setIsDropdownOpen(true);
                    }}
                    placeholder={placeholder}
                    onBlur={() => {
                        timeoutRef.current = window.setTimeout(
                            () => setIsDropdownOpen(false),
                            300,
                        );
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                />
                {value && (
                    <button
                        className={styles.clearButton}
                        onClick={() => setValue('')}
                        type="button"
                        aria-label="Clear search"
                    >
                        <BsX />
                    </button>
                )}
            </div>

            {isDropdownOpen && options.length > 0 && (
                <ul className={styles.dropdownList}>
                    {options.map((item) => (
                        <li
                            key={item.id}
                            className={styles.dropdownItem}
                            onMouseDown={() => handleSelect(item.id)}
                        >
                            <span className={styles.mainText}>
                                {highlightMatch(String(item[optionLabel]), value)}
                            </span>
                            {getSubtext && (
                                <span className={styles.subText}>
                                    {' '}
                                    – {getSubtext(item)}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SearchDropdown;
