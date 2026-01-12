import { apiClient } from "@/utils/apiClient";
import type {
  Record,
  CreateRecordDto,
  UpdateRecordDto,
  RecordListParams,
} from "@/types";

/**
 * 文献记录相关的 API 服务
 * 封装所有与文献记录相关的 HTTP 请求
 */
class RecordService {
  private readonly baseURL = "/api/records";

  /**
   * 获取文献记录列表
   * @param params 查询参数（project_id、分页等）
   * @returns 文献记录列表
   */
  async getRecords(params: RecordListParams): Promise<Record[]> {
    const queryParams = {
      project_id: params.project_id,
      skip: params.skip ?? 0,
      limit: params.limit ?? 100,
    };

    return apiClient.get<Record[]>(`${this.baseURL}/`, { params: queryParams });
  }

  /**
   * 根据 ID 获取单个文献记录
   * @param id 文献记录 ID
   * @returns 文献记录详情
   */
  async getRecordById(id: number): Promise<Record> {
    return apiClient.get<Record>(`${this.baseURL}/${id}`);
  }

  /**
   * 创建新文献记录
   * @param data 文献记录创建数据
   * @returns 创建的文献记录
   */
  async createRecord(data: CreateRecordDto): Promise<Record> {
    return apiClient.post<Record>(`${this.baseURL}/`, data);
  }

  /**
   * 批量创建文献记录
   * @param records 文献记录创建数据数组
   * @returns 创建的文献记录数组
   */
  async createRecordsBatch(records: CreateRecordDto[]): Promise<Record[]> {
    const promises = records.map((record) => this.createRecord(record));
    return Promise.all(promises);
  }

  /**
   * 更新文献记录
   * @param id 文献记录 ID
   * @param data 要更新的数据
   * @returns 更新后的文献记录
   */
  async updateRecord(id: number, data: UpdateRecordDto): Promise<Record> {
    return apiClient.put<Record>(`${this.baseURL}/${id}`, data);
  }

  /**
   * 删除文献记录
   * @param id 文献记录 ID
   * @returns 删除结果
   */
  async deleteRecord(id: number): Promise<{ detail: string }> {
    return apiClient.delete<{ detail: string }>(`${this.baseURL}/${id}`);
  }

  /**
   * 批量删除文献记录
   * @param ids 文献记录 ID 数组
   * @returns 删除结果数组
   */
  async deleteRecordsBatch(ids: number[]): Promise<{ detail: string }[]> {
    const promises = ids.map((id) => this.deleteRecord(id));
    return Promise.all(promises);
  }
}

// 导出单例实例
export const recordService = new RecordService();
