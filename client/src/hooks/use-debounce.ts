/**
 * Custom Hook: useDebounce
 * Trì hoãn một giá trị để ngăn chặn các lệnh gọi API hoặc các hoạt động tốn kém tài nguyên một cách không cần thiết
 * Thường được sử dụng cho các ô tìm kiếm và bộ lọc thời gian thực
 */
import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Dọn dẹp timeout nếu giá trị thay đổi trước khi hết thời gian trễ
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Ví dụ sử dụng:
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * // Sử dụng debouncedSearchTerm cho các lệnh gọi API
 */
