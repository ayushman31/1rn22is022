"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 3001;
const token = process.env.TOKEN;
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
function calculateCorrelation(prices1, prices2) {
    const n = prices1.length;
    if (n !== prices2.length || n === 0)
        return 0;
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
app.get("/avg-stock/:ticker", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ticker } = req.params;
        const minutes = req.query.minutes || '50';
        const url = `http://20.244.56.144/evaluation-service/stocks/${ticker}?minutes=${minutes}&aggregation=average`;
        const data = yield fetch(url, {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });
        const result = yield data.json();
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to fetch stock data",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
//@ts-ignore
app.get("/stockcorrelation", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { minutes } = req.query;
        const tickers = Array.isArray(req.query.ticker) ? req.query.ticker : [req.query.ticker];
        if (!tickers || tickers.length !== 2) {
            return res.status(400).json({
                error: "Exactly two tickers are required."
            });
        }
        const timeFrame = minutes || '50';
        const [stock1AvgData, stock2AvgData, stock1HistoryData, stock2HistoryData] = yield Promise.all([
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
        const [stock1Avg, stock2Avg, stock1History, stock2History] = yield Promise.all([
            stock1AvgData.json(),
            stock2AvgData.json(),
            stock1HistoryData.json(),
            stock2HistoryData.json()
        ]);
        const formatHistory = (history) => {
            return ((history === null || history === void 0 ? void 0 : history.data) || []).map((item) => ({
                price: item.price,
                lastUpdatedAt: item.lastUpdatedAt
            }));
        };
        const prices1 = (stock1History.data || []).map((item) => item.price);
        const prices2 = (stock2History.data || []).map((item) => item.price);
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
    }
    catch (error) {
        res.status(500).json({
            error: "Failed to calculate correlation",
            details: error instanceof Error ? error.message : 'Unknown error'
        });
        return;
    }
}));
app.listen(PORT);
