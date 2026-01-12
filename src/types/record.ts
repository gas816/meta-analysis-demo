/**
 * 文献记录实体类型
 */
export interface Record {
  id: number;
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pmid: string;
  abstract: string;
  source_database: string;
  project_id: number;
  pdf_path: string | null;
  fulltext_available: boolean;
  title_abstract_screening: string | null;
  title_abstract_reason: string | null;
  fulltext_screening: string | null;
  fulltext_reason: string | null;
  final_decision: string | null;
  extracted_data: any | null;
  quality_score: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * 创建文献记录请求参数
 */
export interface CreateRecordDto {
  title: string;
  authors: string;
  journal: string;
  year: number;
  doi: string;
  pmid: string;
  abstract: string;
  source_database: string;
  project_id: number;
}

/**
 * 更新文献记录请求参数
 */
export interface UpdateRecordDto {
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  doi?: string;
  pmid?: string;
  abstract?: string;
  source_database?: string;
  pdf_path?: string;
  fulltext_available?: boolean;
  title_abstract_screening?: string;
  title_abstract_reason?: string;
  fulltext_screening?: string;
  fulltext_reason?: string;
  final_decision?: string;
  extracted_data?: any;
  quality_score?: number;
}

/**
 * 文献记录列表查询参数
 */
export interface RecordListParams {
  project_id: number;
  skip?: number;
  limit?: number;
}
