import { store } from '../data/store.js';

/**
 * AR Repair Guidance System
 * Step-by-step visual repair guides for workers during service.
 * Provides tool recommendations, safety tips, and difficulty ratings.
 */

const REPAIR_GUIDES = {
  Plumbing: {
    'leaking-tap': {
      title: 'Fixing a Leaking Tap',
      difficulty: 'Easy',
      estimatedTime: '20-30 minutes',
      tools: ['Adjustable wrench', 'Plumber tape (Teflon)', 'Screwdriver', 'Bucket'],
      safetyTips: ['Turn off water supply before starting', 'Place bucket under tap to catch water', 'Wear gloves'],
      steps: [
        { step: 1, instruction: 'Turn off the water supply valve under the sink or main supply', tip: 'Test by turning tap on — no water should flow', duration: '2 min', visual: 'locating-valve' },
        { step: 2, instruction: 'Open the tap to release remaining water pressure', tip: 'Let all water drain into bucket', duration: '1 min', visual: 'draining' },
        { step: 3, instruction: 'Remove the tap handle using a screwdriver (look for hidden screw under cap)', tip: 'Some handles pull off directly, others have screws', duration: '3 min', visual: 'removing-handle' },
        { step: 4, instruction: 'Use adjustable wrench to unscrew the cartridge or washer assembly', tip: 'Turn counterclockwise. Note the orientation for reassembly', duration: '5 min', visual: 'removing-cartridge' },
        { step: 5, instruction: 'Inspect the washer/O-ring for damage — replace if worn or cracked', tip: 'Carry standard washer sizes (1/2", 3/4")', duration: '3 min', visual: 'inspect-washer' },
        { step: 6, instruction: 'Wrap plumber tape (Teflon) 3-4 times clockwise around thread', tip: 'Overlap by 50% for best seal. Don\'t over-tape', duration: '2 min', visual: 'applying-tape' },
        { step: 7, instruction: 'Reassemble in reverse order — tighten cartridge, reattach handle', tip: 'Hand-tight first, then 1/4 turn with wrench. Don\'t overtighten', duration: '5 min', visual: 'reassembling' },
        { step: 8, instruction: 'Turn water supply back on and test for leaks', tip: 'Run for 2 minutes, check under sink for drips', duration: '3 min', visual: 'testing' }
      ],
      completionChecklist: ['No drips from tap', 'Handle operates smoothly', 'No leaks under sink', 'Water pressure normal']
    },
    'clogged-drain': {
      title: 'Clearing a Clogged Drain',
      difficulty: 'Medium',
      estimatedTime: '30-45 minutes',
      tools: ['Plunger', 'Drain snake/auger', 'Bucket', 'Rubber gloves', 'Baking soda & vinegar'],
      safetyTips: ['Wear rubber gloves', 'Avoid chemical drain cleaners (damages pipes)', 'Ventilate the area'],
      steps: [
        { step: 1, instruction: 'Remove visible debris/hair from drain opening', tip: 'Use a bent wire or tweezers', duration: '3 min', visual: 'clearing-debris' },
        { step: 2, instruction: 'Try natural solution: pour 1/2 cup baking soda + 1/2 cup vinegar', tip: 'Cover drain and wait 15 minutes. Flush with hot water', duration: '18 min', visual: 'natural-solution' },
        { step: 3, instruction: 'If still clogged, use plunger — fill sink with 2 inches of water', tip: 'Ensure plunger cup covers drain completely. Pump vigorously 15-20 times', duration: '5 min', visual: 'plunging' },
        { step: 4, instruction: 'Use drain snake for deep clogs — insert until resistance', tip: 'Rotate clockwise while pushing. Pull back to extract clog', duration: '10 min', visual: 'snake-drain' },
        { step: 5, instruction: 'Flush with hot water for 2 minutes to clear remaining debris', tip: 'Use boiling water for kitchen drains, hot tap water for bathroom', duration: '3 min', visual: 'flushing' },
        { step: 6, instruction: 'Test drainage — fill sink and release to check flow rate', tip: 'Water should drain within 10 seconds', duration: '2 min', visual: 'testing-flow' }
      ],
      completionChecklist: ['Water drains freely', 'No gurgling sounds', 'No backup in adjacent fixtures', 'P-trap intact']
    }
  },
  Electrical: {
    'fan-not-working': {
      title: 'Ceiling Fan Not Working',
      difficulty: 'Medium',
      estimatedTime: '25-40 minutes',
      tools: ['Voltage tester/multimeter', 'Screwdriver set', 'Wire strippers', 'Insulation tape'],
      safetyTips: ['TURN OFF MAIN SWITCH before starting', 'Use voltage tester to confirm no current', 'Work with one hand only near live wires'],
      steps: [
        { step: 1, instruction: 'Turn off the fan circuit at the MCB/distribution board', tip: 'Label the MCB for clarity. Verify with voltage tester', duration: '2 min', visual: 'turning-off-mcb' },
        { step: 2, instruction: 'Remove fan blades (usually 3-4 screws each)', tip: 'Number blades for same position reassembly', duration: '5 min', visual: 'removing-blades' },
        { step: 3, instruction: 'Remove fan canopy to expose wiring connections', tip: 'Usually held by clip or screw underneath', duration: '2 min', visual: 'removing-canopy' },
        { step: 4, instruction: 'Test with multimeter: check voltage at fan wire connections', tip: 'L-N should show 220-240V when switch is ON', duration: '3 min', visual: 'testing-voltage' },
        { step: 5, instruction: 'Check capacitor — look for bulging or burn marks', tip: 'Capacitor is the small cylindrical/rectangular component', duration: '3 min', visual: 'checking-capacitor' },
        { step: 6, instruction: 'If capacitor is faulty, replace with same microfarad (µF) rating', tip: 'Note: Most fans use 2.5µF or 3.5µF capacitor', duration: '5 min', visual: 'replacing-capacitor' },
        { step: 7, instruction: 'If capacitor is fine, check motor windings with multimeter', tip: 'Resistance between wires should be consistent (not open circuit)', duration: '5 min', visual: 'checking-motor' },
        { step: 8, instruction: 'Reassemble and test — turn on MCB, then fan switch', tip: 'Fan should start smoothly. If not, check regulator', duration: '3 min', visual: 'reassembling' }
      ],
      completionChecklist: ['Fan starts smoothly', 'Speeds work correctly', 'No unusual noise/vibration', 'No wire exposure']
    }
  },
  Cleaning: {
    'deep-cleaning': {
      title: 'Deep Home Cleaning Service',
      difficulty: 'Easy',
      estimatedTime: '3-5 hours',
      tools: ['Mop & bucket', 'All-purpose cleaner', 'Glass cleaner', 'Toilet cleaner', 'Microfiber cloths', 'Vacuum cleaner', 'Scrub brush'],
      safetyTips: ['Wear rubber gloves', 'Ventilate rooms while using chemicals', 'Keep chemicals away from children'],
      steps: [
        { step: 1, instruction: 'Declutter all rooms — remove items from floors and surfaces', tip: 'Place items in designated areas. Don\'t move heavy furniture alone', duration: '30 min', visual: 'decluttering' },
        { step: 2, instruction: 'Dust all surfaces from top to bottom (ceiling fans → shelves → furniture)', tip: 'Use microfiber cloth for dust. Dampen for stubborn dust', duration: '45 min', visual: 'dusting' },
        { step: 3, instruction: 'Clean windows and glass surfaces with glass cleaner', tip: 'Spray on cloth, not directly on glass. Wipe in Z-pattern', duration: '30 min', visual: 'glass-cleaning' },
        { step: 4, instruction: 'Scrub and clean bathrooms — tiles, toilet, sink, mirror', tip: 'Apply toilet cleaner first (let sit 10 min), then scrub', duration: '45 min', visual: 'bathroom-cleaning' },
        { step: 5, instruction: 'Clean kitchen — countertops, sink, appliances, chimney', tip: 'Use baking soda paste for stubborn stains on countertops', duration: '45 min', visual: 'kitchen-cleaning' },
        { step: 6, instruction: 'Vacuum all carpets and upholstery', tip: 'Use attachments for corners and furniture crevices', duration: '30 min', visual: 'vacuuming' },
        { step: 7, instruction: 'Mop all hard floors with appropriate cleaner', tip: 'Start from farthest corner, work toward exit', duration: '30 min', visual: 'mopping' },
        { step: 8, instruction: 'Final inspection — check all areas, replace items, wipe light switches', tip: 'Don\'t forget door handles, remote controls, and light switches', duration: '15 min', visual: 'final-check' }
      ],
      completionChecklist: ['All surfaces dust-free', 'Floors mopped and gleaming', 'Bathrooms sanitized', 'Kitchen spotless', 'No streaks on glass']
    }
  },
  'General Maintenance': {
    'basic-repair': {
      title: 'General Home Repair & Maintenance',
      difficulty: 'Easy-Medium',
      estimatedTime: '1-3 hours',
      tools: ['Hammer', 'Nails & screws', 'Screwdriver set', 'Drill machine', 'Measuring tape', 'Level', 'Wall plugs'],
      safetyTips: ['Check for electrical wires before drilling', 'Use safety glasses when drilling', 'Keep tools organized'],
      steps: [
        { step: 1, instruction: 'Inspect the area and identify all repair tasks', tip: 'Walk through with customer, note all issues on paper', duration: '10 min', visual: 'inspection' },
        { step: 2, instruction: 'Gather all required tools and materials before starting', tip: 'Create a checklist based on identified tasks', duration: '5 min', visual: 'gathering-tools' },
        { step: 3, instruction: 'Check for electrical wires/pipes using stud finder before drilling', tip: 'Run detector slowly across wall surface', duration: '5 min', visual: 'checking-wires' },
        { step: 4, instruction: 'Complete wall repairs — fill holes, fix hooks, mount shelves', tip: 'Use wall plugs for heavy items. Level check after mounting', duration: '30 min', visual: 'wall-repairs' },
        { step: 5, instruction: 'Fix door/window issues — hinges, locks, handles', tip: 'Apply oil to squeaky hinges. Tighten loose screws', duration: '20 min', visual: 'door-repairs' },
        { step: 6, instruction: 'Address plumbing minor issues — tight joints, leaky connections', tip: 'Hand-tighten first, then 1/4 turn with wrench', duration: '15 min', visual: 'plumbing-touchup' },
        { step: 7, instruction: 'Final walkthrough with customer — explain completed work', tip: 'Show before/after if possible. Explain any maintenance tips', duration: '10 min', visual: 'walkthrough' }
      ],
      completionChecklist: ['All tasks completed', 'Area cleaned up', 'Customer satisfied', 'Tools accounted for']
    }
  }
};

export function getRepairGuide(category, issueType) {
  const categoryGuides = REPAIR_GUIDES[category];
  if (!categoryGuides) {
    return {
      available: Object.keys(REPAIR_GUIDES),
      message: `No specific guide for ${category}. Available categories: ${Object.keys(REPAIR_GUIDES).join(', ')}`
    };
  }

  if (issueType && categoryGuides[issueType]) {
    return { guide: categoryGuides[issueType], category, issueType };
  }

  return {
    category,
    availableIssues: Object.keys(categoryGuides),
    guides: categoryGuides
  };
}

export function getAllGuides() {
  const guides = {};
  for (const [category, issues] of Object.entries(REPAIR_GUIDES)) {
    guides[category] = Object.keys(issues).map(issue => ({
      issueType: issue,
      title: issues[issue].title,
      difficulty: issues[issue].difficulty,
      estimatedTime: issues[issue].estimatedTime,
      stepsCount: issues[issue].steps.length
    }));
  }
  return guides;
}

export function getToolRecommendations(category) {
  const guides = REPAIR_GUIDES[category];
  if (!guides) return { tools: [], message: 'No specific tool list for this category' };

  const allTools = new Set();
  for (const guide of Object.values(guides)) {
    guide.tools.forEach(t => allTools.add(t));
  }

  return {
    category,
    recommendedTools: Array.from(allTools),
    totalTools: allTools.size,
    sourceGuides: Object.keys(guides).length
  };
}
