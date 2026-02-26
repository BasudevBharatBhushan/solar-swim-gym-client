import React from 'react';
import { TextField, IconButton, InputAdornment, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { formatDobForDisplay, parseDobInput } from '../utils/dobUtils';

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
    const parsedValue = parseDobInput(value);
    if (parsedValue.iso) {
      const formatted = formatDobForDisplay(value);
      if (formatted !== displayValue && parseDobInput(displayValue).iso !== parsedValue.iso) {
        setDisplayValue(formatted);
      }
    } else if (!value) {
      setDisplayValue('');
    }
  }, [value]);

  const handleCalendarOpen = () => {
    if (!hiddenDateRef.current) return;
    const input = hiddenDateRef.current as HTMLInputElement & { showPicker?: () => void };
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (e) {
        input.click();
      }
      return;
    }
    input.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let masked = val.replace(/[^0-9/]/g, '');
    
    if (val.length > displayValue.length) {
        if (masked.length === 2 && !masked.includes('/')) {
            masked += '/';
        } else if (masked.length === 5 && (masked.match(/\//g) || []).length === 1) {
            masked += '/';
        }
    }
    
    if (masked.length > 10) masked = masked.substring(0, 10);

    setDisplayValue(masked);
    
    const parsed = parseDobInput(masked);
    if (parsed.iso) {
      onChange(parsed.iso);
    } else {
        onChange(''); 
    }
  };

  const handleBlur = () => {
    const parsed = parseDobInput(displayValue);
    if (parsed.iso) {
      onChange(parsed.iso);
      setDisplayValue(formatDobForDisplay(parsed.iso));
      onBlur?.(parsed.iso);
    } else {
      onChange('');
      onBlur?.('');
    }
  };

  const helper = error
    ? helperText
    : [helperText, 'Format: MM/DD/YYYY'].filter(Boolean).join(' - ');

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        label={label}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        error={error}
        helperText={helper}
        placeholder="MM/DD/YYYY"
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
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0,
          width: 0,
          height: 0,
          pointerEvents: 'none'
        }}
      />
    </Box>
  );
};