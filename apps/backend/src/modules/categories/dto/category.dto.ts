export class CategoryDto {
  id!: string;
  name!: string;
  rateLabel!: string;
  iconKey!: string;
}

export class CategoryListResponse {
  data!: CategoryDto[];
}
