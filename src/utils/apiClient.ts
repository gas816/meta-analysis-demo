import axios, { AxiosError } from "axios";
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { ElMessage } from "element-plus";
import type { ApiError } from "@/types";

/**
 * API 客户端配置
 */
interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: ApiClientConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
};

/**
 * 统一的 API 客户端类
 * 提供请求拦截、响应拦截、错误处理等功能
 */
class ApiClient {
  private instance: AxiosInstance;

  constructor(config: Partial<ApiClientConfig> = {}) {
    // 合并配置
    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    // 创建 axios 实例
    this.instance = axios.create({
      baseURL: finalConfig.baseURL,
      timeout: finalConfig.timeout,
      headers: finalConfig.headers,
    });

    // 设置请求拦截器
    this.setupRequestInterceptors();

    // 设置响应拦截器
    this.setupResponseInterceptors();
  }

  /**
   * 设置请求拦截器
   */
  private setupRequestInterceptors(): void {
    this.instance.interceptors.request.use(
      (config) => {
        // 可以在这里添加 token、请求日志等
        // console.log(
        //   `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        //   {
        //     params: config.params,
        //     data: config.data,
        //   }
        // );

        // 如果有 token，可以在这里添加到 headers
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }

        return config;
      },
      (error) => {
        console.error("[API Request Error]", error);
        return Promise.reject(error);
      },
    );
  }

  /**
   * 设置响应拦截器
   */
  private setupResponseInterceptors(): void {
    this.instance.interceptors.response.use(
      (response) => {
        // 请求成功，直接返回数据
        return response;
      },
      (error: AxiosError) => {
        // 统一错误处理
        return this.handleError(error);
      },
    );
  }

  /**
   * 统一错误处理
   */
  private handleError(error: AxiosError): Promise<never> {
    let errorMessage = "请求失败，请稍后重试";
    let errorCode = 500;

    if (error.response) {
      // 服务器响应了错误状态码
      errorCode = error.response.status;
      const data = error.response.data as any;

      switch (errorCode) {
        case 400:
          errorMessage = data?.message || data?.detail || "请求参数错误";
          break;
        case 401:
          errorMessage = "未授权，请先登录";
          // 可以在这里处理登录跳转
          break;
        case 403:
          errorMessage = "没有权限访问该资源";
          break;
        case 404:
          errorMessage = "请求的资源不存在";
          break;
        case 500:
          errorMessage = "服务器内部错误";
          break;
        case 502:
          errorMessage = "网关错误";
          break;
        case 503:
          errorMessage = "服务暂时不可用";
          break;
        default:
          errorMessage = data?.message || data?.detail || errorMessage;
      }

      console.error(`[API Error] ${errorCode}:`, errorMessage, data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = "网络连接失败，请检查网络";
      console.error("[API Error] No response:", error.request);
    } else {
      // 请求配置出错
      errorMessage = error.message || errorMessage;
      console.error("[API Error] Request config error:", error.message);
    }

    // 显示错误提示
    ElMessage.error(errorMessage);

    // 构造标准错误对象
    const apiError: ApiError = {
      code: errorCode,
      message: errorMessage,
      details: error.response?.data,
    };

    return Promise.reject(apiError);
  }

  /**
   * GET 请求
   */
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance
      .get<T, AxiosResponse<T>>(url, config)
      .then((res) => res.data);
  }

  /**
   * POST 请求
   */
  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance
      .post<T, AxiosResponse<T>>(url, data, config)
      .then((res) => res.data);
  }

  /**
   * PUT 请求
   */
  public put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance
      .put<T, AxiosResponse<T>>(url, data, config)
      .then((res) => res.data);
  }

  /**
   * PATCH 请求
   */
  public patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance
      .patch<T, AxiosResponse<T>>(url, data, config)
      .then((res) => res.data);
  }

  /**
   * DELETE 请求
   */
  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance
      .delete<T, AxiosResponse<T>>(url, config)
      .then((res) => res.data);
  }

  /**
   * 获取原始 axios 实例（用于特殊场景）
   */
  public getAxiosInstance(): AxiosInstance {
    return this.instance;
  }
}

/**
 * 导出默认的 API 客户端实例
 */
export const apiClient = new ApiClient();

/**
 * 导出 ApiClient 类，允许创建多个实例
 */
export default ApiClient;
