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
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import axios from 'axios';

interface CorrelationData {
  correlation: number;
  stocks: {
    [key: string]: {
      averagePrice: number;
      priceHistory: Array<{
        price: number;
        lastUpdatedAt: string;
      }>;
    };
  };
}

const STOCK_SYMBOLS = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'PYPL'];

export default function CorrelationHeatmap() {
  const [stock1, setStock1] = useState('NVDA');
  const [stock2, setStock2] = useState('PYPL');
  const [timeInterval, setTimeInterval] = useState(50);
  const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [matrixLoading, setMatrixLoading] = useState(false);

  const fetchCorrelationData = async () => {
    if (stock1 === stock2) {
      setError('Please select two different stocks');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:3001/stockcorrelation?minutes=${timeInterval}&ticker=${stock1}&ticker=${stock2}`
      );
      console.log('Correlation API Response:', response.data);
      setCorrelationData(response.data);
    } catch (err) {
      setError('Failed to fetch correlation data');
      console.error('Error fetching correlation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCorrelationMatrix = async () => {
    setMatrixLoading(true);
    const matrix: number[][] = [];
    const promises: Promise<any>[] = [];

    for (let i = 0; i < STOCK_SYMBOLS.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < STOCK_SYMBOLS.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (i < j) {
          promises.push(
            axios.get(
              `http://localhost:3001/stockcorrelation?minutes=${timeInterval}&ticker=${STOCK_SYMBOLS[i]}&ticker=${STOCK_SYMBOLS[j]}`
            ).then(response => ({
              i, j, correlation: response.data.correlation
            })).catch(() => ({
              i, j, correlation: 0
            }))
          );
        }
      }
    }

    try {
      const results = await Promise.all(promises);
      results.forEach(({ i, j, correlation }) => {
        matrix[i][j] = correlation;
        matrix[j][i] = correlation;
      });
      setCorrelationMatrix(matrix);
    } catch (err) {
      console.error('Error fetching correlation matrix:', err);
    } finally {
      setMatrixLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrelationData();
  }, [stock1, stock2, timeInterval]);

  const getCorrelationColor = (correlation: number) => {
    const intensity = Math.abs(correlation);
    if (correlation > 0) {
      return `rgba(76, 175, 80, ${intensity})`;
    } else {
      return `rgba(244, 67, 54, ${intensity})`;
    }
  };

  const getCorrelationLabel = (correlation: number) => {
    if (correlation > 0.7) return 'Strong Positive';
    if (correlation > 0.3) return 'Moderate Positive';
    if (correlation > -0.3) return 'Weak';
    if (correlation > -0.7) return 'Moderate Negative';
    return 'Strong Negative';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Stock Correlation Analysis
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: '300px', flex: '0 0 300px' }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Controls
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>First Stock</InputLabel>
                <Select
                  value={stock1}
                  label="First Stock"
                  onChange={(e) => setStock1(e.target.value)}
                >
                  {STOCK_SYMBOLS.map((symbol) => (
                    <MenuItem key={symbol} value={symbol}>
                      {symbol}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Second Stock</InputLabel>
                <Select
                  value={stock2}
                  label="Second Stock"
                  onChange={(e) => setStock2(e.target.value)}
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
              
              <Button
                fullWidth
                variant="contained"
                onClick={fetchCorrelationMatrix}
                disabled={matrixLoading}
                sx={{ mt: 2 }}
              >
                {matrixLoading ? 'Loading Matrix...' : 'Generate Full Correlation Matrix'}
              </Button>
              
              {correlationData && (
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Correlation Details
                  </Typography>
                  <Chip 
                    label={`${stock1} vs ${stock2}`} 
                    color="primary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label={`Correlation: ${correlationData.correlation?.toFixed(4) || 'N/A'}`} 
                    color="secondary" 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                  <Chip 
                    label={getCorrelationLabel(correlationData.correlation || 0)} 
                    color={(correlationData.correlation || 0) > 0 ? 'success' : 'error'} 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flex: 1, minWidth: '400px' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Correlation Visualization
            </Typography>
            
            {loading && (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography>Loading correlation data...</Typography>
              </Box>
            )}
            
            {error && (
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography color="error">{error}</Typography>
              </Box>
            )}
            
            {!loading && !error && correlationData && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Card sx={{ flex: 1, minWidth: '200px' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {stock1} Details
                      </Typography>
                      <Typography variant="body2">
                        Average Price: ${correlationData.stocks[stock1]?.averagePrice?.toFixed(2) || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Data Points: {correlationData.stocks[stock1]?.priceHistory?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                  
                  <Card sx={{ flex: 1, minWidth: '200px' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {stock2} Details
                      </Typography>
                      <Typography variant="body2">
                        Average Price: ${correlationData.stocks[stock2]?.averagePrice?.toFixed(2) || 'N/A'}
                      </Typography>
                      <Typography variant="body2">
                        Data Points: {correlationData.stocks[stock2]?.priceHistory?.length || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Correlation Analysis
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 3, 
                        textAlign: 'center',
                        backgroundColor: getCorrelationColor(correlationData.correlation || 0),
                        borderRadius: 2,
                        border: '2px solid #ddd'
                      }}
                    >
                      <Typography variant="h3" component="div">
                        {correlationData.correlation?.toFixed(4) || 'N/A'}
                      </Typography>
                      <Typography variant="h6">
                        {getCorrelationLabel(correlationData.correlation || 0)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            )}
          </Paper>
          
          {correlationMatrix.length > 0 && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Full Correlation Matrix
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      {STOCK_SYMBOLS.map((symbol) => (
                        <TableCell key={symbol} align="center">
                          <strong>{symbol}</strong>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {STOCK_SYMBOLS.map((symbol1, i) => (
                      <TableRow key={symbol1}>
                        <TableCell component="th" scope="row">
                          <strong>{symbol1}</strong>
                        </TableCell>
                        {STOCK_SYMBOLS.map((symbol2, j) => (
                          <TableCell 
                            key={symbol2} 
                            align="center"
                            sx={{ 
                              backgroundColor: getCorrelationColor(correlationMatrix[i][j]),
                              color: Math.abs(correlationMatrix[i][j]) > 0.5 ? 'white' : 'black'
                            }}
                          >
                            {correlationMatrix[i][j].toFixed(3)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
} 