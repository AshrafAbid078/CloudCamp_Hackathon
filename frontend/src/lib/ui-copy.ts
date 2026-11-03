const copy = {
    // Brand & Roles
    brandName: 'Meridian Grid',
    facilityManager: 'Facility Manager',
    gridOperator: 'Grid Operator',
    admin: 'Administrator',
    switchRole: 'Switch View',
    roleTaglineFM: 'Operational Cost & Carbon Savings',
    roleTaglineGO: 'Feeder Reliability & Stress Mitigation',

    // Navigation & Layout
    navDashboard: 'Dashboard',
    navForecast: 'Solar Forecast',
    navDispatch: 'Dispatch Studio',
    navCopilot: 'AI Copilot Studio',
    navHistory: 'History & Audits',
    navData: 'Data Provenance',
    navSettings: 'Settings',
    navDocs: 'Documentation',
    navAbout: 'About',
    navSignIn: 'Sign In',
    navSignOut: 'Sign Out',
    navCreateAccount: 'Create Account',

    // Common Actions
    btnOpenDemo: 'Open Live Demo',
    btnRunScenario: 'Run Scenario',
    btnCompare: 'Compare',
    btnApprove: 'Approve',
    btnReject: 'Reject',
    btnShift: 'Shift Window',
    btnSend: 'Send',
    btnThinking: 'Computing…',
    btnReset: 'Reset',
    btnAddMachine: '+ Add Custom Machine',

    // Metrics & KPIs
    kpiCostSavings: 'Electricity Cost Savings',
    kpiCarbonReduced: 'Carbon Emissions Avoided',
    kpiPeakShaved: 'Peak Demand Shaved',
    kpiSolarOutput: 'Peak Solar Irradiance',
    kpiGridStress: 'Grid Carbon Intensity',
    kpiFeederHeadroom: 'Substation Feeder Headroom',

    // Forecast Page
    forecastTitle: 'Solar & Weather Forecast Studio',
    forecastSubtitle: 'Regional GHI outlook with fixed display ranges; not calibrated probabilities',
    forecastHorizon: 'Forecast Lookahead Horizon',
    forecastExpected: 'Expected solar',
    forecastWorstCase: 'Lower display scenario (-25%)',
    forecastBestCase: 'Upper display scenario (+18%)',

    // Dispatch Page
    dispatchTitle: 'Dispatch & Schedule Studio',
    dispatchSubtitle: 'Mixed-Integer Linear Programming (MILP) load optimization under Time-of-Use tariffs',
    dispatchBaseline: 'Baseline Schedule',
    dispatchOptimized: 'Optimized Schedule',
    dispatchGantt: '24-Hour Process & Battery Gantt Timeline',
    customMachineTitle: 'Add Custom Factory Machine',
    customMachineName: 'Machine Name',
    customMachinePower: 'Power Rating (kW)',
    customMachineDuration: 'Operating Duration (Hours)',
    customMachineDeadline: 'Shipment Deadline (Hour 1–24)',
    customMachineSubmit: 'Solve With Custom Machine',

    // Copilot Page
    copilotTitle: 'AI Copilot & MCP Studio',
    copilotSubtitle: 'Grounded reasoning engine powered by Google Gemini & Model Context Protocol (MCP) tools',
    copilotLiveSession: 'Live Grounded Session',
    copilotPlaceholderFM: 'Ask about solar output, cost reductions, or equipment shifting…',
    copilotPlaceholderGO: 'Ask about feeder headroom, MW peak reduction, or stress windows…',
    copilotQuickPrompts: 'Quick Prompts',

    // Footer & Notices
    footerNotice: 'Planning demo · Synthetic assets and tariff · No equipment control',
} as const;

export const t = (key: keyof typeof copy): string => copy[key];
