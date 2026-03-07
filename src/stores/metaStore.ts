import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { recordService } from "@/api/records";
import type { Record as LiteratureRecord } from "@/types";

export interface Literature {
  id: number;
  title: string;
  authors: string;
  year: number;
  journal: string;
  doi?: string;
  pmid?: string;
  abstract?: string;
  source_database?: string;
  project_id?: number;
  status: "pending" | "included" | "excluded";
  exclusionPhase?: "screening" | "eligibility";
  reason?: string;
  selected: boolean;
  fulltext_available?: boolean;
  pdf_path?: string | null;
  // 映射到 API 的字段
  title_abstract_screening?: string | null;
  title_abstract_reason?: string | null;
  fulltext_screening?: string | null;
  fulltext_reason?: string | null;
  final_decision?: string | null;
}

export type ExtractionRow = { [key: string]: any };

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
  // 0. Current Project
  const currentProjectId = ref<number | null>(null);

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
    dateRange: ["" as string, "" as string],
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

  const fetchLiteraturesFromDatabase = async (projectId: number) => {
    try {
      // 调用真实 API 获取文献记录
      const response = await recordService.getRecords({
        project_id: projectId,
        skip: 0,
        limit: 1000,
      });

      // 验证响应数据结构
      if (!response || !response.items || !Array.isArray(response.items)) {
        console.warn("API 返回的数据结构不正确:", response);
        literatures.value = [];
        return;
      }

      const records: LiteratureRecord[] = response.items;

      // 将 API 返回的 LiteratureRecord 类型转换为 Literature 类型
      literatures.value = records?.map((record) => ({
        id: record.id,
        title: record.title,
        authors: record.authors,
        year: record.year,
        journal: record.journal,
        doi: record.doi,
        pmid: record.pmid,
        abstract: record.abstract,
        source_database: record.source_database,
        project_id: record.project_id,
        status:
          (record.final_decision as "pending" | "included" | "excluded") ||
          "pending",
        exclusionPhase: undefined,
        reason:
          record.title_abstract_reason || record.fulltext_reason || undefined,
        selected: false,
        fulltext_available: record.fulltext_available || false,
        pdf_path: record.pdf_path || null,
        title_abstract_screening: record.title_abstract_screening,
        title_abstract_reason: record.title_abstract_reason,
        fulltext_screening: record.fulltext_screening,
        fulltext_reason: record.fulltext_reason,
        final_decision: record.final_decision,
      }));
    } catch (error) {
      console.error("获取文献失败:", error);
      literatures.value = [];
      // 不再抛出错误，让调用方自行处理
    }
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
      } else if (lit.year < 2010) {
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
      (l) => l.status === "included",
    );

    includedLits.forEach((lit, index) => {
      const newRow: ExtractionRow = {
        id: Date.now() + index,
        studyId: `S${String(index + 1).padStart(3, "0")}`,
        author: lit.authors.split(" ")[0], // Simple extraction
        year: lit.year || 2020,
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
      (h) => h.prop !== prop,
    );
  };

  const runMetaAnalysis = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    analysis.heterogeneity = { i2: 45.5, q: 12.3, p: 0.04 };
    analysis.isAnalyzed = true;
  };

  const generateReport = async () => {
    if (!currentProjectId.value) {
      throw new Error("请先选择项目");
    }

    // 导入 jobService
    const { jobService } = await import("@/api/jobs");

    // 创建报告生成任务
    const job = await jobService.createJob({
      project_id: currentProjectId.value,
      job_type: "generate_report",
      parameters: JSON.stringify({
        report_type: "full",
        include_sections: ["background", "methods", "results", "conclusion"],
      }),
    });

    // 轮询任务状态
    const pollInterval = 1000; // 1秒
    const maxAttempts = 300; // 最多5分钟
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      const updatedJob = await jobService.getJob(job.id);

      if (updatedJob.status === "completed") {
        // 解析 result_data 获取报告文件名
        if (updatedJob.result_data) {
          const resultData = JSON.parse(updatedJob.result_data);
          const reportFilename = resultData.report_filename;

          // 获取报告内容
          const markdownContent = await jobService.getReport(reportFilename);
          reportContent.value = markdownContent;
        }
        break;
      } else if (updatedJob.status === "failed") {
        throw new Error(updatedJob.error_message || "报告生成失败");
      } else if (updatedJob.status === "cancelled") {
        throw new Error("任务已取消");
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("报告生成超时");
    }
  };

  /**
   * 从项目数据加载到 store
   * @param project 项目详情数据
   */
  const loadProjectData = (project: any) => {
    // 设置当前项目ID
    currentProjectId.value = project.id;

    // 先重置所有状态，防止切换项目时残留旧数据
    pico.population = "";
    pico.intervention = "";
    pico.comparison = "";
    pico.outcome = "";
    pico.question = "";

    search.databases = ["PubMed", "Scopus"];
    search.dateRange = ["", ""];
    search.terms = [{ id: 1, logic: "AND", term: "" }];
    search.searchString = "";

    criteria.inclusion = [];
    criteria.exclusion = [];

    literatures.value = [];
    extractionHeaders.value = [];
    extractionData.value = [];

    analysis.effectModel = "OR";
    analysis.heterogeneity = { i2: 0, q: 0, p: 0 };
    analysis.isAnalyzed = false;

    grade.tool = "NOS";
    grade.profiles = [];

    reportContent.value = "";

    // 1. PICO - 从 research_question 解析
    if (project.research_question) {
      pico.question = project.research_question;

      // 尝试从问题中解析各部分（格式：本研究旨在探讨 [干预] 对 [人群] 的 [结局] 风险的影响，并与 [对照] 进行比较。）
      const match = project.research_question.match(
        /探讨\s+(.+?)\s+对\s+(.+?)\s+的\s+(.+?)\s+风险的影响，并与\s+(.+?)\s+进行比较/,
      );
      if (match) {
        pico.intervention = match[1].trim();
        pico.population = match[2].trim();
        pico.outcome = match[3].trim();
        pico.comparison = match[4].trim();
      }
    }

    // 2. Search Strategy
    if (project.search_keywords) {
      try {
        const keywords = JSON.parse(project.search_keywords);
        if (keywords.query) {
          search.searchString = keywords.query;
        }
        if (keywords.date_range && Array.isArray(keywords.date_range)) {
          search.dateRange = keywords.date_range as [string, string];
        }
      } catch (e) {
        console.error("解析 search_keywords 失败:", e);
      }
    }

    if (project.search_databases) {
      search.databases = project.search_databases
        .split(",")
        .map((db: string) => db.trim());
    }

    // 3. Criteria
    if (project.inclusion_criteria) {
      try {
        const criteria_data = JSON.parse(project.inclusion_criteria);
        criteria.inclusion = Array.isArray(criteria_data) ? criteria_data : [];
      } catch (e) {
        console.error("解析 inclusion_criteria 失败:", e);
      }
    }

    if (project.exclusion_criteria) {
      try {
        const criteria_data = JSON.parse(project.exclusion_criteria);
        criteria.exclusion = Array.isArray(criteria_data) ? criteria_data : [];
      } catch (e) {
        console.error("解析 exclusion_criteria 失败:", e);
      }
    }
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
        year: 2018,
        journal: "Sleep Med",
        status: "included",
        selected: true,
        fulltext_available: true,
      },
      {
        id: 102,
        title:
          "Insomnia and risk of dementia: a prospective population-based study",
        authors: "Baker et al.",
        year: 2017,
        journal: "J Gerontol",
        status: "included",
        selected: true,
        fulltext_available: false,
      },
      {
        id: 103,
        title:
          "Sleep disturbance and Alzheimer's disease: A longitudinal analysis",
        authors: "Chen et al.",
        year: 2016,
        journal: "Neurology",
        status: "included",
        selected: true,
        fulltext_available: true,
      },
      {
        id: 104,
        title: "Prevalence of insomnia in patients with dementia",
        authors: "Davis et al.",
        year: 2015,
        journal: "J Psych",
        status: "excluded",
        exclusionPhase: "eligibility",
        reason: "横断面研究 (Cross-sectional)",
        selected: false,
        fulltext_available: false,
      },
      {
        id: 105,
        title: "Effect of sleep medication on memory consolidation",
        authors: "Evans et al.",
        year: 2019,
        journal: "Pharmacol",
        status: "excluded",
        exclusionPhase: "screening",
        reason: "干预措施不符 (Intervention mismatch)",
        selected: false,
        fulltext_available: false,
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
    currentProjectId,
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
    loadProjectData,
    fillXuExampleData,
  };
});
