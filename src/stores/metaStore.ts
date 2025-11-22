import { defineStore } from "pinia";
import { reactive, ref } from "vue";

export interface Literature {
  id: number;
  title: string;
  authors: string;
  year: string;
  journal: string;
  status: "pending" | "included" | "excluded";
  exclusionPhase?: "screening" | "eligibility";
  reason?: string;
  selected: boolean;
}

export type ExtractionRow = Record<string, any>;

export interface ExtractionHeader {
  prop: string;
  label: string;
  width?: string;
  type?: "text" | "number";
}

export interface SearchTerm {
  id: number;
  logic: "AND" | "OR" | "NOT";
  term: string;
}

export interface GradeProfile {
  id: string;
  outcomeName: string;
  importance: string; // 'Critical' | 'Important' | 'Not important'
  numberOfStudies: number;
  sampleSize: number;

  // 降级因素
  riskOfBias: {
    rating: "not-serious" | "serious" | "very-serious";
    reason: string;
  };
  inconsistency: {
    rating: "not-serious" | "serious" | "very-serious";
    reason: string;
  };
  indirectness: {
    rating: "not-serious" | "serious" | "very-serious";
    reason: string;
  };
  imprecision: {
    rating: "not-serious" | "serious" | "very-serious";
    reason: string;
  };
  publicationBias: {
    rating: "undetected" | "suspected" | "strongly-suspected";
    reason: string;
  };

  // 升级因素
  largeEffect: boolean;
  doseResponse: boolean;
  confounding: boolean;

  overallCertainty: "High" | "Moderate" | "Low" | "Very Low";
  resultSummary: string;
}

export const useMetaStore = defineStore("meta", () => {
  // 1. PICO
  const pico = reactive({
    population: "",
    intervention: "",
    comparison: "",
    outcome: "",
    question: "",
  });

  // 2. Search Strategy
  const search = reactive({
    databases: ["PubMed", "Web of Science"] as string[],
    dateRange: [] as string[],
    terms: [{ id: 1, logic: "AND", term: "" }] as SearchTerm[],
    searchString: "",
  });

  // 3. Criteria
  const criteria = reactive({
    inclusion: [] as string[],
    exclusion: [] as string[],
  });

  // 4. Literature
  const literatures = ref<Literature[]>([]);

  // 5. Data Extraction
  const extractionHeaders = ref<ExtractionHeader[]>([]);
  const extractionData = ref<ExtractionRow[]>([]);

  // 6. Analysis
  const analysis = reactive({
    effectModel: "OR",
    heterogeneity: { i2: 0, q: 0, p: 0 },
    isAnalyzed: false,
  });

  // 7. GRADE
  const grade = reactive({
    tool: "NOS", // 'NOS', 'ROBINS-I', 'Cochrane RoB 2'
    profiles: [] as GradeProfile[],
  });

  // 8. Report
  const reportContent = ref("");

  // Actions (Simulate LLM)
  const generatePicoQuestion = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    pico.question = `本研究旨在探讨 ${pico.intervention || "[干预]"} 对 ${
      pico.population || "[人群]"
    } 的 ${pico.outcome || "[结局]"} 风险的影响，并与 ${
      pico.comparison || "[对照]"
    } 进行比较。`;
  };

  const generateSearchString = async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));

    let kwString = "";
    search.terms.forEach((item, index) => {
      if (!item.term.trim()) return;

      if (index === 0) {
        kwString += `(${item.term})`;
      } else {
        kwString += ` ${item.logic} (${item.term})`;
      }
    });

    if (!kwString) kwString = "[Keywords]";

    search.searchString = `(${kwString}) AND ("${
      search.dateRange[0] || "Start"
    }" : "${search.dateRange[1] || "End"}") [Date - Publication]`;
  };

  const fetchLiteraturesFromDatabase = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Mock fetching results based on search strategy
    literatures.value = [
      {
        id: 1,
        title:
          "Association between coffee consumption and mortality: A cohort study",
        authors: "Smith et al.",
        year: "2020",
        journal: "JAMA",
        status: "pending",
        selected: false,
      },
      {
        id: 2,
        title:
          "Coffee intake and risk of cardiovascular disease: A meta-analysis",
        authors: "Johnson et al.",
        year: "2019",
        journal: "BMJ",
        status: "pending",
        selected: false,
      },
      {
        id: 3,
        title: "Effects of caffeine on sleep quality in adults",
        authors: "Brown et al.",
        year: "2021",
        journal: "Sleep",
        status: "pending",
        selected: false,
      },
      {
        id: 4,
        title: "Long-term effects of caffeine consumption on hypertension",
        authors: "Davis et al.",
        year: "2018",
        journal: "Lancet",
        status: "pending",
        selected: false,
      },
      {
        id: 5,
        title: "Caffeine and cognitive decline: A systematic review",
        authors: "Wilson et al.",
        year: "2022",
        journal: "Neurology",
        status: "pending",
        selected: false,
      },
      {
        id: 6,
        title: "Effects of caffeine on blood pressure in rats",
        authors: "Rat et al.",
        year: "2015",
        journal: "Animal Science",
        status: "pending",
        selected: false,
      },
      {
        id: 7,
        title: "Coffee consumption and risk of type 2 diabetes",
        authors: "Ding et al.",
        year: "2014",
        journal: "Diabetes Care",
        status: "pending",
        selected: false,
      },
      {
        id: 8,
        title: "Caffeine intake and bone mineral density",
        authors: "Hallstrom et al.",
        year: "2006",
        journal: "Osteoporos Int",
        status: "pending",
        selected: false,
      },
      {
        id: 9,
        title: "The impact of tea and coffee on hydration status",
        authors: "Water et al.",
        year: "2019",
        journal: "Nutrition",
        status: "pending",
        selected: false,
      },
      {
        id: 10,
        title: "Genetics of caffeine metabolism",
        authors: "Gene et al.",
        year: "2020",
        journal: "Nature Genetics",
        status: "pending",
        selected: false,
      },
    ];
  };

  const autoScreenLiteratures = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    literatures.value.forEach((lit) => {
      const title = lit.title.toLowerCase();

      // Phase 1: Screening (Title/Abstract/Year/Type)
      if (
        title.includes("meta-analysis") ||
        title.includes("systematic review")
      ) {
        lit.status = "excluded";
        lit.exclusionPhase = "screening";
        lit.reason = "非原始研究 (Review/Meta-analysis)";
      } else if (
        title.includes("rats") ||
        title.includes("animal") ||
        title.includes("mice")
      ) {
        lit.status = "excluded";
        lit.exclusionPhase = "screening";
        lit.reason = "非人类研究 (Animal study)";
      } else if (lit.year < "2010") {
        lit.status = "excluded";
        lit.exclusionPhase = "screening";
        lit.reason = "发表时间过早 (Pre-2010)";
      } else if (title.includes("genetics") || title.includes("mechanism")) {
        lit.status = "excluded";
        lit.exclusionPhase = "screening";
        lit.reason = "基础研究/机制研究 (Basic Science)";
      }

      // Phase 2: Eligibility (Full text/Detailed Criteria)
      else if (title.includes("sleep")) {
        lit.status = "excluded";
        lit.exclusionPhase = "eligibility";
        lit.reason = "结局指标不符合 (Outcome mismatch: Sleep)";
      } else if (
        title.includes("hypertension") ||
        title.includes("blood pressure")
      ) {
        lit.status = "excluded";
        lit.exclusionPhase = "eligibility";
        lit.reason = "研究人群不符合 (Population mismatch: Hypertension)";
      } else if (title.includes("hydration")) {
        lit.status = "excluded";
        lit.exclusionPhase = "eligibility";
        lit.reason = "干预措施不符合 (Intervention mismatch: Hydration focus)";
      }

      // Included
      else {
        lit.status = "included";
        lit.reason = "符合纳入标准";
      }
    });
  };

  const generateExtractionTemplate = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate AI generating headers based on PICO
    const headers: ExtractionHeader[] = [
      { prop: "studyId", label: "Study ID", width: "100", type: "text" },
      { prop: "author", label: "First Author", width: "120", type: "text" },
      { prop: "year", label: "Year", width: "80", type: "number" },
      { prop: "country", label: "Country", width: "100", type: "text" },
      { prop: "design", label: "Study Design", width: "120", type: "text" },
    ];

    // Add PICO specific columns
    if (pico.population) {
      headers.push({
        prop: "population_n",
        label: "Sample Size (N)",
        width: "100",
        type: "number",
      });
      headers.push({
        prop: "age_mean",
        label: "Mean Age",
        width: "100",
        type: "number",
      });
    }

    if (pico.intervention) {
      headers.push({
        prop: "intervention_dose",
        label: `${pico.intervention} Dose`,
        width: "150",
        type: "text",
      });
    }

    if (pico.outcome) {
      headers.push({
        prop: "outcome_measure",
        label: `${pico.outcome} Measure`,
        width: "150",
        type: "text",
      });
      headers.push({
        prop: "effect_size",
        label: "Effect Size (OR/RR)",
        width: "120",
        type: "number",
      });
      headers.push({
        prop: "ci_lower",
        label: "95% CI Lower",
        width: "100",
        type: "number",
      });
      headers.push({
        prop: "ci_upper",
        label: "95% CI Upper",
        width: "100",
        type: "number",
      });
    }

    extractionHeaders.value = headers;
  };

  const extractDataFromLit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (extractionHeaders.value.length === 0) {
      await generateExtractionTemplate();
    }

    // Clear existing data to avoid duplicates if re-running
    extractionData.value = [];

    // Filter included literatures
    const includedLits = literatures.value.filter(
      (l) => l.status === "included"
    );

    includedLits.forEach((lit, index) => {
      const newRow: ExtractionRow = {
        id: Date.now() + index,
        studyId: `S${String(index + 1).padStart(3, "0")}`,
        author: lit.authors.split(" ")[0], // Simple extraction
        year: parseInt(lit.year) || 2020,
        country: ["USA", "UK", "China", "Japan", "Germany"][
          Math.floor(Math.random() * 5)
        ], // Mock
        design: "Cohort Study", // Mock
      };

      // Fill dynamic fields with mock data
      extractionHeaders.value.forEach((h) => {
        if (newRow[h.prop] === undefined) {
          if (h.type === "number")
            newRow[h.prop] = Number((Math.random() * 10 + 1).toFixed(2));
          else newRow[h.prop] = "AI Data";
        }
      });

      extractionData.value.push(newRow);
    });
  };

  const addExtractionHeader = (header: ExtractionHeader) => {
    extractionHeaders.value.push(header);
  };

  const removeExtractionHeader = (prop: string) => {
    extractionHeaders.value = extractionHeaders.value.filter(
      (h) => h.prop !== prop
    );
  };

  const runMetaAnalysis = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    analysis.heterogeneity = { i2: 45.5, q: 12.3, p: 0.04 };
    analysis.isAnalyzed = true;
  };

  const generateReport = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    reportContent.value = `
# Meta分析报告

## 1. 背景
本研究基于PICO框架构建，旨在探究 **${pico.intervention}** 对 **${
      pico.population
    }** 的影响。

## 2. 方法
检索了 ${search.databases.join(
      ", "
    )} 数据库。纳入标准包括：${criteria.inclusion.join("; ")}。

## 3. 结果
共纳入 ${
      literatures.value.filter((l) => l.status === "included").length
    } 篇文献。
异质性检验显示 $I^2 = ${analysis.heterogeneity.i2}%$。

## 4. 结论
根据 GRADE 评级，主要结局指标的证据质量为 **${
      grade.profiles[0]?.overallCertainty || "未评估"
    }**。
    `;
  };

  const fillXuExampleData = async () => {
    // 1. PICO
    pico.population = "一般人群 (General population)";
    pico.intervention = "睡眠问题 (Sleep problems)";
    pico.comparison = "正常睡眠 (Normal sleep)";
    pico.outcome = "认知障碍或痴呆风险 (Risk of cognitive decline or dementia)";
    pico.question = "睡眠问题与认知障碍风险的关联";

    // 2. Search Strategy
    search.databases = ["PubMed", "EMBASE"];
    search.dateRange = ["1980-01", "2019-02"];
    search.terms = [
      { id: 1, logic: "AND", term: "dementia OR cognitive" },
      { id: 2, logic: "AND", term: "sleep OR insomnia" },
    ];
    search.searchString =
      '(dementia OR cognitive) AND (sleep OR insomnia) AND ("1980-01" : "2019-02") [Date - Publication]';

    // 3. Criteria
    criteria.inclusion = [
      "纵向研究 (Longitudinal studies)",
      "探讨睡眠指标与痴呆或认知下降的关联",
      "报告多变量校正的风险比/OR等数据",
    ];
    criteria.exclusion = [
      "未提供效应值",
      "横断面研究 (Cross-sectional studies)",
      "仅有摘要无全文",
    ];

    // 4. Literature (Mock Data based on Xu et al. context)
    literatures.value = [
      {
        id: 101,
        title:
          "Sleep duration and cognitive decline in the elderly: A 10-year cohort study",
        authors: "Anderson et al.",
        year: "2018",
        journal: "Sleep Med",
        status: "included",
        selected: true,
      },
      {
        id: 102,
        title:
          "Insomnia and risk of dementia: a prospective population-based study",
        authors: "Baker et al.",
        year: "2017",
        journal: "J Gerontol",
        status: "included",
        selected: true,
      },
      {
        id: 103,
        title:
          "Sleep disturbance and Alzheimer's disease: A longitudinal analysis",
        authors: "Chen et al.",
        year: "2016",
        journal: "Neurology",
        status: "included",
        selected: true,
      },
      {
        id: 104,
        title: "Prevalence of insomnia in patients with dementia",
        authors: "Davis et al.",
        year: "2015",
        journal: "J Psych",
        status: "excluded",
        exclusionPhase: "eligibility",
        reason: "横断面研究 (Cross-sectional)",
        selected: false,
      },
      {
        id: 105,
        title: "Effect of sleep medication on memory consolidation",
        authors: "Evans et al.",
        year: "2019",
        journal: "Pharmacol",
        status: "excluded",
        exclusionPhase: "screening",
        reason: "干预措施不符 (Intervention mismatch)",
        selected: false,
      },
    ];

    // 5. Data Extraction
    extractionHeaders.value = [
      { prop: "studyId", label: "Study ID", width: "80", type: "text" },
      { prop: "author", label: "Author", width: "100", type: "text" },
      { prop: "year", label: "Year", width: "70", type: "number" },
      { prop: "design", label: "Design", width: "100", type: "text" },
      { prop: "n", label: "N", width: "80", type: "number" },
      { prop: "exposure", label: "Exposure", width: "120", type: "text" },
      { prop: "outcome", label: "Outcome", width: "120", type: "text" },
      { prop: "es", label: "RR", width: "80", type: "number" },
      { prop: "lower", label: "95% CI L", width: "80", type: "number" },
      { prop: "upper", label: "95% CI U", width: "80", type: "number" },
    ];

    extractionData.value = [
      {
        id: 1,
        studyId: "S001",
        author: "Anderson",
        year: 2018,
        design: "Cohort",
        n: 1500,
        exposure: "Short Sleep",
        outcome: "Cognitive Decline",
        es: 1.35,
        lower: 1.1,
        upper: 1.65,
      },
      {
        id: 2,
        studyId: "S002",
        author: "Baker",
        year: 2017,
        design: "Cohort",
        n: 2300,
        exposure: "Insomnia",
        outcome: "Dementia",
        es: 1.27,
        lower: 1.12,
        upper: 1.45,
      },
      {
        id: 3,
        studyId: "S003",
        author: "Chen",
        year: 2016,
        design: "Cohort",
        n: 1800,
        exposure: "Sleep Disturbance",
        outcome: "AD",
        es: 1.19,
        lower: 1.05,
        upper: 1.35,
      },
    ];

    // 6. Analysis
    analysis.effectModel = "RR";
    analysis.heterogeneity = { i2: 27.5, q: 4.5, p: 0.12 }; // Low heterogeneity
    analysis.isAnalyzed = true;

    // 7. GRADE
    grade.tool = "NOS";
    grade.profiles = [
      {
        id: "g1",
        outcomeName: "Cognitive Impairment / Dementia",
        importance: "Critical",
        numberOfStudies: 3,
        sampleSize: 5600,
        riskOfBias: {
          rating: "not-serious",
          reason: "Most studies had high NOS scores",
        },
        inconsistency: { rating: "not-serious", reason: "I2 < 30%" },
        indirectness: {
          rating: "not-serious",
          reason: "Directly addressed PICO",
        },
        imprecision: { rating: "not-serious", reason: "Narrow CIs" },
        publicationBias: {
          rating: "undetected",
          reason: "Funnel plot symmetric",
        },
        largeEffect: false,
        doseResponse: true,
        confounding: false,
        overallCertainty: "High",
        resultSummary:
          "睡眠问题显著增加认知障碍风险 (RR=1.27, 95%CI 1.16–1.39)。",
      },
    ];

    // 8. Report
    reportContent.value = `
# Meta分析报告：睡眠问题与认知障碍风险

## 1. 背景 (Introduction)
本研究旨在系统评价睡眠问题（如失眠、睡眠时长异常）与认知障碍或痴呆风险之间的关联。

## 2. 方法 (Methods)
我们检索了 PubMed 和 EMBASE 数据库，截止日期为 2019年2月。
**纳入标准**：纵向研究；探讨睡眠指标与痴呆关联；提供多变量校正效应量。
**排除标准**：横断面研究；无全文；未报告效应值。
质量评估采用 Newcastle-Ottawa Scale (NOS)。

## 3. 结果 (Results)
共纳入 3 项代表性队列研究（实际Xu研究纳入更多），总样本量 5600 人。
**主要发现**：
- 失眠显著增加全因认知障碍风险 (RR=1.27, 95%CI 1.16–1.39)。
- 异质性较低 ($I^2 = 27.5\%$)。
- 剂量-反应分析显示睡眠时长与痴呆风险呈U型关系。

## 4. 结论 (Conclusion)
基于 **High** 质量证据，睡眠问题是认知障碍和痴呆的重要风险因素。建议关注睡眠健康以预防认知下降。
    `;
  };

  return {
    pico,
    search,
    criteria,
    literatures,
    extractionHeaders,
    extractionData,
    analysis,
    grade,
    reportContent,
    generatePicoQuestion,
    generateSearchString,
    fetchLiteraturesFromDatabase,
    autoScreenLiteratures,
    generateExtractionTemplate,
    extractDataFromLit,
    addExtractionHeader,
    removeExtractionHeader,
    runMetaAnalysis,
    generateReport,
    fillXuExampleData,
  };
});
