/**
 * 项目实体类型
 */
export interface Project {
  id: number;
  name: string;
  description: string;
  research_question: string | null;
  search_keywords: string | null;
  search_databases: string | null;
  inclusion_criteria: string | null;
  exclusion_criteria: string | null;
  total_records: number;
  screened_records: number;
  included_records: number;
  created_at: string;
  updated_at: string;
}

/**
 * 创建项目请求参数
 */
export interface CreateProjectDto {
  name: string;
  description: string;
}

/**
 * 更新项目请求参数
 */
export interface UpdateProjectDto {
  name?: string;
  description?: string;
  research_question?: string;
  search_keywords?: string;
  search_databases?: string;
  inclusion_criteria?: string;
  exclusion_criteria?: string;
}

/**
 * 项目列表查询参数
 */
export interface ProjectListParams {
  skip?: number;
  limit?: number;
  search?: string;
}
