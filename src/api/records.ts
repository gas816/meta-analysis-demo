import { apiClient } from "@/utils/apiClient";
import type {
  Record,
  CreateRecordDto,
  UpdateRecordDto,
  RecordListParams,
  PaginationResponse,
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
   * @returns 文献记录列表和分页信息
   */
  async getRecords(
    params: RecordListParams,
  ): Promise<PaginationResponse<Record>> {
    const queryParams = {
      project_id: params.project_id,
      skip: params.skip ?? 0,
      limit: params.limit ?? 10,
    };

    try {
      // 尝试调用支持分页响应的API
      const response = await apiClient.get<any>(`${this.baseURL}/`, {
        params: queryParams,
      });

      // 检查响应是否为分页格式
      if (response && typeof response === "object" && "items" in response) {
        return response as PaginationResponse<Record>;
      }

      // 如果响应是数组格式，转换为分页格式
      if (Array.isArray(response)) {
        return {
          items: response as Record[],
          total: response.length,
          skip: queryParams.skip,
          limit: queryParams.limit,
        };
      }

      // 如果响应格式不正确，返回空结果
      console.warn("API 返回的数据格式不正确:", response);
      return {
        items: [],
        total: 0,
        skip: queryParams.skip,
        limit: queryParams.limit,
      };
    } catch (error) {
      console.error("获取文献记录失败:", error);
      // 返回空结果而不是抛出错误
      return {
        items: [],
        total: 0,
        skip: queryParams.skip,
        limit: queryParams.limit,
      };
    }
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

  /**
   * 上传文献PDF文件
   * @param id 文献记录 ID
   * @param formData 包含PDF文件的FormData
   * @returns 上传后的文献记录信息
   */
  async uploadPdf(id: number, formData: FormData): Promise<Record> {
    return apiClient.post<Record>(
      `${this.baseURL}/${id}/upload-pdf`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  }
}

// 导出单例实例
export const recordService = new RecordService();
