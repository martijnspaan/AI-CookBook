export interface Cookbook {
  readonly id: string;
  title: string;
  author: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCookbookRequest {
  title: string;
  author: string;
}

export interface UpdateCookbookRequest {
  title?: string;
  author?: string;
}
