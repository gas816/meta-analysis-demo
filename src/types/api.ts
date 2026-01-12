/**
 * 通用 API 响应类型
 */
export interface ApiResponse<T = any> {
  data: T;
  code?: number;
  message?: string;
}

/**
 * 通用 API 错误类型
 */
export interface ApiError {
  code: number;
  message: string;
  details?: any;
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

/**
 * 分页响应数据
 */
export interface PaginationResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
