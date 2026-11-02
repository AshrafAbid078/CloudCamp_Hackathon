// frontend/src/lib/i18n/translations.ts

export type Language = 'en' | 'bn';

export const translations = {
  en: {
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
    forecastSubtitle: 'Regional GHI and atmospheric lookaheads with P10–P90 probabilistic confidence bounds',
    forecastHorizon: 'Forecast Lookahead Horizon',
    forecastExpected: 'Expected Solar (P50)',
    forecastWorstCase: 'Overcast Lower Bound (P10)',
    forecastBestCase: 'Clearsky Upper Bound (P90)',

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
    bilingualNotice: 'Language: English / বাংলা',
  },
  bn: {
    // Brand & Roles
    brandName: 'মেরিডিয়ান গ্রিড',
    facilityManager: 'ফ্যাসিলিটি ম্যানেজার',
    gridOperator: 'গ্রিড অপারেটর',
    admin: 'অ্যাডমিনিস্ট্রেটর',
    switchRole: 'রোল পরিবর্তন',
    roleTaglineFM: 'বিদ্যুৎ বিল ও কার্বন নির্গমন সাশ্রয়',
    roleTaglineGO: 'ফিডার স্থায়িত্ব ও গ্রিড লোড নিয়ন্ত্রণ',

    // Navigation & Layout
    navDashboard: 'ড্যাশবোর্ড',
    navForecast: 'সৌর পূর্বাভাস',
    navDispatch: 'ডিসপ্যাচ স্টুডিও',
    navCopilot: 'এআই সহকারী (Copilot)',
    navHistory: 'পূর্ববর্তী ইতিহাস',
    navData: 'ডাটা প্রোভেন্যান্স',
    navSettings: 'সেটিংস',
    navDocs: 'ডকুমেন্টেশন',
    navAbout: 'আমাদের সম্পর্কে',
    navSignIn: 'লগইন করুন',
    navSignOut: 'লগআউট',
    navCreateAccount: 'অ্যাকাউন্ট খুলুন',

    // Common Actions
    btnOpenDemo: 'লাইভ ডেমো দেখুন',
    btnRunScenario: 'পরিস্থিতি বিশ্লেষণ',
    btnCompare: 'তুলনা করুন',
    btnApprove: 'অনুমোদন',
    btnReject: 'বাতিল',
    btnShift: 'সময় পরিবর্তন',
    btnSend: 'পাঠান',
    btnThinking: 'হিসাব হচ্ছে…',
    btnReset: 'রিসেট',
    btnAddMachine: '+ নতুন মেশিন যোগ করুন',

    // Metrics & KPIs
    kpiCostSavings: 'বিদ্যুৎ বিল সাশ্রয়',
    kpiCarbonReduced: 'কার্বন নির্গমন হ্রাস',
    kpiPeakShaved: 'সর্বোচ্চ পিক লোড হ্রাস',
    kpiSolarOutput: 'সর্বোচ্চ সৌর বিকিরণ (GHI)',
    kpiGridStress: 'গ্রিড কার্বন তীব্রতা',
    kpiFeederHeadroom: 'সাবস্টেশন ফিডার হেডরুম',

    // Forecast Page
    forecastTitle: 'সৌর ও আবহাওয়া পূর্বাভাস স্টুডিও',
    forecastSubtitle: 'আঞ্চলিক GHI এবং P10–P90 সম্ভাব্যতা ভিত্তিক সোলার কনফিডেন্স কার্ভ',
    forecastHorizon: 'পূর্বাভাস সময়সীমা',
    forecastExpected: 'প্রত্যাশিত সৌরবিদ্যুৎ (P50)',
    forecastWorstCase: 'মেঘলা আকাশ সর্বনিম্ন সীমা (P10)',
    forecastBestCase: 'মেঘমুক্ত আকাশ সর্বোচ্চ সীমা (P90)',

    // Dispatch Page
    dispatchTitle: 'ডিসপ্যাচ ও শিডিউলিং স্টুডিও',
    dispatchSubtitle: 'পিক ও অফ-পিক ট্যারিফে MILP ম্যাথমেটিকাল অপ্টিমাইজেশন শিডিউল',
    dispatchBaseline: 'সাধারণ শিডিউল (Baseline)',
    dispatchOptimized: 'অপ্টিমাইজড শিডিউল',
    dispatchGantt: '২৪ ঘণ্টার মেশিন ও ব্যাটারি গ্যান্ট চার্ট',
    customMachineTitle: 'কারখানার নতুন মেশিন যোগ করুন',
    customMachineName: 'মেশিনের নাম',
    customMachinePower: 'পাওয়ার রেটিং (kW)',
    customMachineDuration: 'কত ঘণ্টা চলবে (Duration)',
    customMachineDeadline: 'কখন শেষ করতে হবে (Deadline ১–২৪)',
    customMachineSubmit: 'মেশিন যোগ করে নতুন শিডিউল বের করুন',

    // Copilot Page
    copilotTitle: 'এআই সহকারী ও MCP স্টুডিও',
    copilotSubtitle: 'Google Gemini এবং Model Context Protocol (MCP) চালিত নির্ভরযোগ্য এআই ইঞ্জিন',
    copilotLiveSession: 'লাইভ গ্রাউন্ডেড সেশন',
    copilotPlaceholderFM: 'সোলার উৎপাদন, বিদ্যুৎ সাশ্রয় বা মেশিন শিফটিং নিয়ে প্রশ্ন করুন…',
    copilotPlaceholderGO: 'ফিডার ক্যাপাসিটি, মেগাওয়াট পিক রিডাকশন বা গ্রিড স্ট্রেস সম্পর্কে জানুন…',
    copilotQuickPrompts: 'কুইক প্রম্পটস',

    // Footer & Notices
    footerNotice: 'পরিকল্পনা ডেমো · সিনথেটিক অ্যাসেট ও ট্যারিফ · কোনো হার্ডওয়্যার নিয়ন্ত্রণ নেই',
    bilingualNotice: 'ভাষা: English / বাংলা',
  },
};

export type TranslationKey = keyof typeof translations.en;

