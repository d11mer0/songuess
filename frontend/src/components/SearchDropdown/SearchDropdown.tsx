import React, { useState, useRef } from 'react';
import styles from './SearchDropdown.module.css';

interface SearchDropdownProps<T> {
    value: string;
    setValue: (value: string) => void;
    options: T[];
    onSelect: (id: number) => void;
    optionLabel: keyof T; // Поле, яке використовується як назва
    getSubtext?: (item: T) => string; // Функція, яка повертає додатковий текст (наприклад, ім'я артиста)
}

const SearchDropdown = <T extends { id: number }>({
    value,
    setValue,
    options,
    onSelect,
    optionLabel,
    getSubtext,
}: SearchDropdownProps<T>) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const timeoutRef = useRef<number | null>(null);

    const handleSelect = (id: number) => {
        onSelect(id);
        setValue(''); // Очищаємо поле інпута

        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
            setIsDropdownOpen(false);
            inputRef.current?.blur();
        }, 3000);
    };

    return (
        <div className={styles.searchContainer}>
            <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    setIsDropdownOpen(true);
                }}
                placeholder="Пошук..."
                onBlur={() => {
                    timeoutRef.current = window.setTimeout(
                        () => setIsDropdownOpen(false),
                        300,
                    );
                }}
                onFocus={() => setIsDropdownOpen(true)}
            />

            {isDropdownOpen && options.length > 0 && (
                <ul className={styles.dropdownList}>
                    {options.map((item) => (
                        <li
                            key={item.id}
                            className={styles.dropdownItem}
                            onMouseDown={() => handleSelect(item.id)}
                        >
                            <span className={styles.mainText}>
                                {String(item[optionLabel])}
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
