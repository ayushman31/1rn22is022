'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Paper,
  Chip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface StockData {
  average?: number;
  data?: Array<{
    price: number;
    lastUpdatedAt: string;
  }>;
  prices?: number[];
  timestamps?: string[];
}

const STOCK_SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'PYPL'];

export default function StockPage() {
  const [selectedStock, setSelectedStock] = useState('NVDA');
  const [timeInterval, setTimeInterval] = useState(50);
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`http://localhost:3001/avg-stock/${selectedStock}?minutes=${timeInterval}`);
      console.log('Stock API Response:', response.data);
      setStockData(response.data);
    } catch (err) {
      setError('Failed to fetch stock data');
      console.error('Error fetching stock data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [selectedStock, timeInterval]);

  const formatChartData = () => {
    if (!stockData) return [];
    
    // Handle different possible response structures
    let dataArray: any[] = [];
    if (stockData.data && Array.isArray(stockData.data)) {
      dataArray = stockData.data;
    } else if (stockData.prices && Array.isArray(stockData.prices)) {
      dataArray = stockData.prices.map((price: number, index: number) => ({
        price,
        lastUpdatedAt: stockData.timestamps ? stockData.timestamps[index] : new Date().toISOString()
      }));
    }
    
    return dataArray.map((item: any, index: number) => ({
      time: item.lastUpdatedAt ? new Date(item.lastUpdatedAt).toLocaleTimeString() : `Point ${index + 1}`,
      price: typeof item === 'number' ? item : item.price,
      index: index + 1
    }));
  };

  const chartData = formatChartData();
  const averagePrice = stockData?.average || 0;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stock Price Analysis
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: '300px', flex: '0 0 300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Controls
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Stock Symbol</InputLabel>
                <Select
                  value={selectedStock}
                  label="Stock Symbol"
                  onChange={(e) => setSelectedStock(e.target.value)}
                >
                  {STOCK_SYMBOLS.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                margin="normal"
                label="Time Interval (minutes)"
                type="number"
                value={timeInterval}
                onChange={(e) => setTimeInterval(Number(e.target.value))}
                inputProps={{ min: 1, max: 1000 }}
              />
              
              {stockData && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Stock Details
                  </Typography>
                  <Chip 
                    label={`Symbol: ${selectedStock}`} 
                    color="primary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label={`Average: $${averagePrice.toFixed(2)}`} 
                    color="secondary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label={`Data Points: ${chartData.length}`} 
                    color="default" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: '400px' }}>
          <Paper sx={{ p: 2, height: 500 }}>
            <Typography variant="h6" gutterBottom>
              Price Chart - {selectedStock} (Last {timeInterval} minutes)
            </Typography>
            
            {loading && (
              <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography>Loading...</Typography>
              </Box>
            )}
            
            {error && (
              <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            
            {!loading && !error && chartData.length > 0 && (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#1976d2" 
                    strokeWidth={2}
                    dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#1976d2', strokeWidth: 2 }}
                    name={`${selectedStock} Price`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={() => averagePrice} 
                    stroke="#dc004e" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Average Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
} 