import { api } from "@/lib/api";
import type { Category } from "@/types/domain";

type CategoryListResponse = { data: Category[] };

export const categoryService = {
  async list(): Promise<Category[]> {
    const res = await api.get<CategoryListResponse>("/categories");
    return res.data;
  },
};
