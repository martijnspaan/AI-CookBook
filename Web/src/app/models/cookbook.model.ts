export interface Cookbook {
  readonly id: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCookbookRequest {
  title: string;
}

export interface UpdateCookbookRequest {
  title?: string;
}
