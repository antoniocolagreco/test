export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: string;
}
