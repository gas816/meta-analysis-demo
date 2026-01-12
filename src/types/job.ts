// Job 相关类型定义

// 任务状态
export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

// 任务类型
export type JobType =
  | "crawl_and_screen" // 文献爬取+初步筛选
  | "fulltext_screen" // 全文筛选
  | "data_extraction" // 数据提取
  | "meta_analysis" // Meta分析
  | "generate_report"; // 生成报告

// 任务对象
export interface Job {
  id: number;
  project_id: number;
  job_type: JobType;
  status: JobStatus;
  progress: number; // 进度百分比 0-100
  current_step: string; // 当前步骤描述
  total_items: number; // 总项目数
  processed_items: number; // 已处理项目数
  parameters?: string; // JSON格式的任务参数
  result_data?: string; // JSON格式的结果数据
  error_message?: string; // 错误信息
  created_at: string; // 创建时间
  started_at?: string; // 开始时间
  completed_at?: string; // 完成时间
}

// 创建任务请求
export interface CreateJobRequest {
  project_id: number;
  job_type: JobType;
  parameters?: string; // JSON格式的任务参数
}

// 任务参数类型定义
export interface CrawlAndScreenParams {
  databases: string[]; // 数据库列表，如 ["pubmed", "cochrane"]
  keywords: string; // 检索关键词
}

export interface FulltextScreenParams {
  record_ids: number[]; // 需要筛选的文献记录ID列表
}

export interface DataExtractionParams {
  record_ids: number[]; // 需要提取数据的文献记录ID列表
}

export interface MetaAnalysisParams {
  analysis_type: string; // 分析类型
  outcome_measures: string[]; // 结局指标
}

export interface GenerateReportParams {
  report_type: string; // 报告类型
  include_sections: string[]; // 包含的章节
}
