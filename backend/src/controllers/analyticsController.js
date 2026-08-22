import { getDemandForecastData, getDemandHeatmapCoordinates } from '../services/demandForecastService.js';
import { store } from '../data/store.js';

export async function getDemandAnalytics(req, res) {
  try {
    const { district, serviceCategory } = req.query;
    const forecast = await getDemandForecastData({ district, category: serviceCategory });
    const heatmap = getDemandHeatmapCoordinates();

    // Generate trend data for Recharts
    const trendData = [
      { day: 'Mon', actualJobs: 14, predictedDemand: 16, workersAvailable: 15 },
      { day: 'Tue', actualJobs: 18, predictedDemand: 20, workersAvailable: 16 },
      { day: 'Wed', actualJobs: 12, predictedDemand: 14, workersAvailable: 15 },
      { day: 'Thu', actualJobs: 22, predictedDemand: 25, workersAvailable: 18 },
      { day: 'Fri', actualJobs: 26, predictedDemand: 28, workersAvailable: 20 },
      { day: 'Sat (Expected)', actualJobs: 30, predictedDemand: 34, workersAvailable: 22 },
      { day: 'Sun (Expected)', actualJobs: 28, predictedDemand: 31, workersAvailable: 20 }
    ];

    // Service popularity breakdown
    const categoryVolume = [
      { name: 'Plumbing', count: 28, share: '32%' },
      { name: 'Electrical', count: 22, share: '25%' },
      { name: 'Caregiving', count: 14, share: '16%' },
      { name: 'Appliance Repair', count: 10, share: '11%' },
      { name: 'Carpentry', count: 8, share: '9%' },
      { name: 'Gardening', count: 6, share: '7%' }
    ];

    return res.json({
      success: true,
      forecast,
      heatmap,
      trendData,
      categoryVolume
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
