import axios from "axios";
import { getToken } from "./auth";

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT automatically on every request (if available)
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerUser(
  payload: RegisterPayload
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/register", payload);
  return data;
}

// ---------------------------------------------------------------------------
// People endpoints
// ---------------------------------------------------------------------------

export interface Encounter {
  id: string;
  personId: string;
  transcript: string | null;
  summary: string | null;
  topics: string[] | null;
  location: string | null;
  date: string;
}

export interface Person {
  id: string;
  userId: number;
  name: string | null;
  occupation: string | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  encounters: Encounter[];
}

export async function getPeople(): Promise<Person[]> {
  const { data } = await api.get<Person[]>("/api/people");
  return data;
}

export async function getPersonById(id: string): Promise<Person> {
  const { data } = await api.get<Person>(`/api/people/${id}`);
  return data;
}

export default api;
