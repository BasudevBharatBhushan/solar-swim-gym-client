import React from 'react';
import { TextField, IconButton, InputAdornment } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { formatDobForDisplay } from '../utils/dobUtils';

interface DobFieldProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  onBlur?: (value: string) => void;
}

export const DobField: React.FC<DobFieldProps> = ({
  value,
  onChange,
  label,
  required = false,
  error = false,
  helperText,
  size = 'medium',
  fullWidth = true,
  onBlur,
}) => {
  const hiddenDateRef = React.useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = React.useState(formatDobForDisplay(value));

  React.useEffect(() => {
    setDisplayValue(formatDobForDisplay(value));
  }, [value]);

  const handleCalendarOpen = () => {
    if (!hiddenDateRef.current) return;
    const input = hiddenDateRef.current as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }
    input.click();
  };

  const helper = error
    ? helperText
    : [helperText, 'Format: M/D/YYYY'].filter(Boolean).join(' · ');

  return (
    <>
      <TextField
        label={label}
        value={displayValue}
        onChange={(e) => {
          const nextValue = e.target.value;
          setDisplayValue(nextValue);
          onChange(nextValue);
        }}
        onBlur={() => onBlur?.(displayValue)}
        error={error}
        helperText={helper}
        placeholder="M/D/YYYY"
        required={required}
        size={size}
        fullWidth={fullWidth}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleCalendarOpen} edge="end" aria-label="Pick date">
                  <CalendarMonthIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <input
        ref={hiddenDateRef}
        type="date"
        value={value && value.includes('-') ? value : ''}
        onChange={(e) => {
          const iso = e.target.value;
          onChange(iso);
          setDisplayValue(formatDobForDisplay(iso));
          onBlur?.(iso);
        }}
        style={{ display: 'none' }}
      />
    </>
  );
};
