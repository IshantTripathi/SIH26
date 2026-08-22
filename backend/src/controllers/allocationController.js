import { rankWorkersForJob } from '../services/fairAllocationEngine.js';
import { classifyProblemDescription } from '../services/problemClassifier.js';
import { store } from '../data/store.js';

export function simulateAllocation(req, res) {
  try {
    const {
      serviceCategory = 'Plumbing',
      urgency = 'Normal',
      customerLocation = { lat: 28.6140, lng: 77.2095 }
    } = req.body;

    const result = rankWorkersForJob({
      serviceCategory,
      urgency,
      customerLocation
    });

    return res.json({
      success: true,
      serviceCategory,
      urgency,
      allocationResult: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function classifyIntent(req, res) {
  try {
    const { problemText, problemDescription, text } = req.body;
    const input = problemText || problemDescription || text || '';
    const intent = classifyProblemDescription(input);
    return res.json({
      success: true,
      intent,
      classification: intent
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export function getFivePlumberScenario(req, res) {
  try {
    const result = rankWorkersForJob({
      serviceCategory: 'Plumbing',
      urgency: 'Normal',
      customerLocation: { lat: 28.6140, lng: 77.2095 } // Customer Demo 01 location
    });

    return res.json({
      success: true,
      scenarioTitle: 'SIH Scenario 2 — Fair Work Allocation Benchmark (5 Plumbers)',
      explanation: 'Demonstrates why Worker B is chosen over Worker A (Nearest, but High Workload) and Worker C (Offline/Unavailable).',
      result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
