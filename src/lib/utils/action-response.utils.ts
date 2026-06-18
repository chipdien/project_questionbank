/**
 * Standard format for Server Action responses.
 */
export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

/**
 * Standard format for paginated data in Server Action responses.
 */
export interface PaginatedData<T> {
  data: T[];
  pagination: {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

/**
 * Returns a successful ActionResponse.
 * 
 * @param data The data to return to the client.
 * @param message Optional success message.
 */
export function successResponse<T>(data: T, message?: string): ActionResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Returns an error ActionResponse.
 * 
 * @param error The error message.
 * @param code Optional error code.
 */
export function errorResponse(error: string, code?: string): ActionResponse<never> {
  return {
    success: false,
    error,
    code,
  };
}

/**
 * Returns a successful ActionResponse with paginated data.
 * 
 * @param data Array of items on the current page.
 * @param totalCount Total number of items across all pages.
 * @param page Current page number (1-indexed).
 * @param pageSize Number of items per page.
 */
export function paginatedResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  pageSize: number
): ActionResponse<PaginatedData<T>> {
  const totalPages = Math.ceil(totalCount / pageSize);
  return {
    success: true,
    data: {
      data,
      pagination: {
        totalCount,
        page,
        pageSize,
        totalPages,
      },
    },
  };
}
