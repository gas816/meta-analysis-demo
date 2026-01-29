import { apiClient } from "@/utils/apiClient";
import type { Job, CreateJobRequest } from "@/types";

/**
 * Jobs 相关的 API 服务
 * 封装所有与后台任务相关的 HTTP 请求
 */
class JobService {
  private readonly baseURL = "/api/jobs";

  /**
   * 创建新任务
   * @param data 任务创建数据
   * @returns 创建的任务对象
   */
  async createJob(data: CreateJobRequest): Promise<Job> {
    return apiClient.post<Job>(`${this.baseURL}/`, data);
  }

  /**
   * 获取任务详情
   * @param id 任务 ID
   * @returns 任务对象
   */
  async getJob(id: number): Promise<Job> {
    return apiClient.get<Job>(`${this.baseURL}/${id}`);
  }

  /**
   * 获取项目的所有任务
   * @param projectId 项目 ID
   * @returns 任务列表
   */
  async getProjectJobs(projectId: number): Promise<Job[]> {
    return apiClient.get<Job[]>(`${this.baseURL}/`, {
      params: { project_id: projectId },
    });
  }

  /**
   * 取消任务
   * @param id 任务 ID
   * @returns 更新后的任务对象
   */
  async cancelJob(id: number): Promise<Job> {
    return apiClient.post<Job>(`${this.baseURL}/${id}/cancel`);
  }

  /**
   * 获取报告文件内容
   * @param filename 报告文件名
   * @returns 报告的 Markdown 内容
   */
  async getReport(filename: string): Promise<string> {
    const response = await apiClient
      .getAxiosInstance()
      .get<string>(`/api/reports/${filename}`, {
        responseType: "text",
      });
    return response.data;
  }
}

// 导出单例实例
export const jobService = new JobService();
