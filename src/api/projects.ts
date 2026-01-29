import { apiClient } from "@/utils/apiClient";
import type {
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  ProjectListParams,
} from "@/types";

/**
 * 项目相关的 API 服务
 * 封装所有与项目相关的 HTTP 请求
 */
class ProjectService {
  private readonly baseURL = "/api/projects";

  /**
   * 获取项目列表
   * @param params 查询参数（分页、搜索等）
   * @returns 项目列表
   */
  async getProjects(params?: ProjectListParams): Promise<Project[]> {
    const queryParams = {
      skip: params?.skip ?? 0,
      limit: params?.limit ?? 20,
      ...(params?.search && { search: params.search }),
    };

    return apiClient.get<Project[]>(this.baseURL, { params: queryParams });
  }

  /**
   * 根据 ID 获取单个项目
   * @param id 项目 ID
   * @returns 项目详情
   */
  async getProjectById(id: number): Promise<Project> {
    return apiClient.get<Project>(`${this.baseURL}/${id}`);
  }

  /**
   * 创建新项目
   * @param data 项目创建数据
   * @returns 创建的项目
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    return apiClient.post<Project>(`${this.baseURL}/`, data);
  }

  /**
   * 更新项目
   * @param id 项目 ID
   * @param data 更新数据
   * @returns 更新后的项目
   */
  async updateProject(id: number, data: UpdateProjectDto): Promise<Project> {
    return apiClient.patch<Project>(`${this.baseURL}/${id}`, data);
  }

  /**
   * 删除项目
   * @param id 项目 ID
   * @returns 删除结果
   */
  async deleteProject(id: number): Promise<void> {
    return apiClient.delete<void>(`${this.baseURL}/${id}`);
  }

  /**
   * 保存研究问题（暂存）
   * @param projectId 项目 ID
   * @param data 研究问题数据
   * @returns 更新后的项目
   */
  async saveResearchQuestion(
    projectId: number,
    data: {
      research_question: string;
    }
  ): Promise<Project> {
    return apiClient.patch<Project>(
      `${this.baseURL}/${projectId}/research-question`,
      data
    );
  }

  /**
   * 保存检索策略（暂存）
   * @param projectId 项目 ID
   * @param data 检索策略数据
   * @returns 更新后的项目
   */
  async saveSearchStrategy(
    projectId: number,
    data: {
      databases: string[];
      query_string: string;
      date_range?: string[] | null;
    }
  ): Promise<Project> {
    return apiClient.patch<Project>(
      `${this.baseURL}/${projectId}/search-strategy`,
      data
    );
  }

  /**
   * 保存纳入/排除标准（暂存）
   * @param projectId 项目 ID
   * @param data 纳入/排除标准数据
   * @returns 更新后的项目
   */
  async saveCriteria(
    projectId: number,
    data: {
      inclusion: string[];
      exclusion: string[];
    }
  ): Promise<Project> {
    return apiClient.patch<Project>(
      `${this.baseURL}/${projectId}/criteria`,
      data
    );
  }
}

/**
 * 导出项目服务单例
 */
export const projectService = new ProjectService();

/**
 * 导出 ProjectService 类
 */
export default ProjectService;
