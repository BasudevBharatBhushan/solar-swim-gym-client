
import { useState } from 'react';
import { Paper, InputBase, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface AccountSearchProps {
  onSearch: (query: string) => void;
}

export const AccountSearch = ({ onSearch }: AccountSearchProps) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Paper
      component="form"
      sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: 400, boxShadow: 'none', border: '1px solid #e2e8f0' }}
      onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search accounts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <IconButton type="button" sx={{ p: '10px' }} aria-label="search" onClick={handleSearch}>
        <SearchIcon />
      </IconButton>
    </Paper>
  );
};
