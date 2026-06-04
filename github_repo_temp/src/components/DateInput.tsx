import React, { useState, useEffect } from 'react';

type DateInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function DateInput({ onChange, value, ...props }: DateInputProps) {
  const [internalValue, setInternalValue] = useState(value || '');

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value as string);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    
    setInternalValue(formatted);
    e.target.value = formatted;
    
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <input
      type="text"
      placeholder="DD/MM/YYYY"
      value={internalValue}
      onChange={handleChange}
      {...props}
    />
  );
}
