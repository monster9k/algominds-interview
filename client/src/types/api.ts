/**
 * Global API Types and Interfaces
 * Common response types used across different API endpoints
 * Provides type safety for API communication
 */

// Generic API response wrapper
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

// Error response structure
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Pagination metadata
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response structure
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Common query parameters for list endpoints
export interface ListQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, any>;
}

// Base entity with common fields
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Upload file response
export interface FileUploadResponse {
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

/**
 * Usage example:
 * interface User extends BaseEntity {
 *   email: string;
 *   name: string;
 * }
 *
 * type UserListResponse = ApiResponse<PaginatedResponse<User>>;
 */
