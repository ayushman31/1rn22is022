import 'dotenv/config';
import express, { Request, Response } from 'express';
const app = express();
const PORT = 3001;
const token = process.env.TOKEN;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

function calculateCorrelation(prices1: number[], prices2: number[]): number {
    const n = prices1.length;
    if (n !== prices2.length || n === 0) return 0;

    const mean1 = prices1.reduce((a, b) => a + b, 0) / n;
    const mean2 = prices2.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;

    for (let i = 0; i < n; i++) {
        const diff1 = prices1[i] - mean1;
        const diff2 = prices2[i] - mean2;
        numerator += diff1 * diff2;
        denominator1 += diff1 * diff1;
        denominator2 += diff2 * diff2;
    }

    return numerator / Math.sqrt(denominator1 * denominator2);
}

app.get("/avg-stock/:ticker", async (req: Request, res: Response) => {
    try {
        const { ticker } = req.params;
        const minutes = req.query.minutes || '50';
        
        const url = `http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}&aggregation=average`;
        const data = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        
        const result = await data.json();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to fetch stock data",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

//@ts-ignore
app.get("/stockcorrelation", async (req: Request, res: Response) => {
    try {
        const { minutes } = req.query;
        const tickers = Array.isArray(req.query.ticker) ? req.query.ticker : [req.query.ticker];
        
        if (!tickers || tickers.length !== 2) {
            return res.status(400).json({ 
                error: "Exactly two tickers are required." 
            });
        }

        const timeFrame = minutes || '50';
        
        const [stock1AvgData, stock2AvgData, stock1HistoryData, stock2HistoryData] = await Promise.all([
            fetch(`http://20.244.56.144/evaluation-service/stocks/${tickers[0]}?minutes=${timeFrame}&aggregation=average`, {
                headers: { "Authorization": "Bearer " + token }
            }),
            fetch(`http://20.244.56.144/evaluation-service/stocks/${tickers[1]}?minutes=${timeFrame}&aggregation=average`, {
                headers: { "Authorization": "Bearer " + token }
            }),
            fetch(`http://20.244.56.144/evaluation-service/stocks/${tickers[0]}?minutes=${timeFrame}`, {
                headers: { "Authorization": "Bearer " + token }
            }),
            fetch(`http://20.244.56.144/evaluation-service/stocks/${tickers[1]}?minutes=${timeFrame}`, {
                headers: { "Authorization": "Bearer " + token }
            })
        ]);

        if (!stock1AvgData.ok || !stock2AvgData.ok || !stock1HistoryData.ok || !stock2HistoryData.ok) {
            throw new Error('Failed to fetch stock data');
        }

        const [stock1Avg, stock2Avg, stock1History, stock2History] = await Promise.all([
            stock1AvgData.json(),
            stock2AvgData.json(),
            stock1HistoryData.json(),
            stock2HistoryData.json()
        ]);

        const formatHistory = (history: any) => {
            return (history?.data || []).map((item: any) => ({
                price: item.price,
                lastUpdatedAt: item.lastUpdatedAt
            }));
        };

        const prices1 = (stock1History.data || []).map((item: any) => item.price);
        const prices2 = (stock2History.data || []).map((item: any) => item.price);
        const correlation = calculateCorrelation(prices1, prices2);

        const response = {
            correlation,
            stocks: {
                [String(tickers[0])]: {
                    averagePrice: stock1Avg.average,
                    priceHistory: formatHistory(stock1History)
                },
                [String(tickers[1])]: {
                    averagePrice: stock2Avg.average,
                    priceHistory: formatHistory(stock2History)
                }
            }
        };

        res.status(200).json(response);
        return;
    } catch (error) {
        res.status(500).json({ 
            error: "Failed to calculate correlation",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
    }
});

app.listen(PORT);
