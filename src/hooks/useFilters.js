import { useState, useCallback } from "react";

export const useFilters = (initialFilters = { name: "", status: "", month: "" }) => {
  const [filters, setFilters] = useState(initialFilters);

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      name: "",
      status: "",
      month: "",
    });
  }, []);

  const hasActiveFilters = filters.name || filters.status || filters.month;

  return {
    filters,
    setFilters,
    handleFilterChange,
    clearFilters,
    hasActiveFilters,
  };
};