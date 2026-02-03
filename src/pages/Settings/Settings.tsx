import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { AgeProfiles } from './AgeProfiles';
import { SubscriptionTerms } from './SubscriptionTerms';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const Settings = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Settings & Configuration
      </Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="settings tabs">
          <Tab label="Age Profile" />
          <Tab label="Subscription Terms" />
        </Tabs>
      </Box>
      <CustomTabPanel value={value} index={0}>
        <AgeProfiles />
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        <SubscriptionTerms />
      </CustomTabPanel>
    </Box>
  );
};
