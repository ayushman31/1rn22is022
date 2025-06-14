'use client';

import { useState } from 'react';
import { Container, AppBar, Toolbar, Typography, Tabs, Tab, Box } from '@mui/material';
import StockPage from './components/StockPage';
import CorrelationHeatmap from './components/CorrelationHeatmap';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Home() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Stock Price Aggregation
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Stock Page" />
            <Tab label="Correlation Heatmap" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <StockPage />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <CorrelationHeatmap />
        </TabPanel>
      </Container>
    </>
  );
}
