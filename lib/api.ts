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

// Full encounter — returned by getPersonById (all fields)
export interface Encounter {
  id: string;
  personId: string;
  transcript: string | null;
  summary: string | null;
  topics: string[] | null;
  location: string | null;
  date: string;
}
 
// Partial encounter — returned by matchFace (only these 4 fields are selected)
export interface EncounterSummary {
  summary: string | null;
  topics: string[] | null;
  location: string | null;
  date: string;
}
 
// Full person with all encounters — returned by getPersonById
export interface Person {
  id: string;
  userId: number;
  name: string | null;
  occupation: string | null;
  notes: string | null;
  photoUrl: string | null;
  faceEmbedding: number[]; // included in response but usually ignored on frontend
  createdAt: string;
  encounters: Encounter[];
}
 
// Person with partial encounters — returned by matchFace
// encounters only has { summary, topics, location, date }
export interface MatchedPerson {
  id: string;
  userId: number;
  name: string | null;
  occupation: string | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  encounters: EncounterSummary[];
}
 
// Person with at most 1 encounter — returned by getAllPeople
// (controller does take: 1 on encounters)
export interface PersonPreview {
  id: string;
  userId: number;
  name: string | null;
  occupation: string | null;
  notes: string | null;
  photoUrl: string | null;
  createdAt: string;
  encounters: Encounter[]; // max 1 item, the most recent
}

// POST /api/people/match
export async function matchFace(
  embedding: number[]
): Promise<{ match: MatchedPerson | null; distance?: number }> {
  const { data } = await api.post<{ match: MatchedPerson | null; distance?: number }>(
    "/api/people/match",
    { embedding }
  );
  return data;
}
 
// GET /api/people/:id
export async function getPersonById(id: string): Promise<Person> {
  const { data } = await api.get<Person>(`/api/people/${id}`);
  return data;
}
 
// GET /api/people
export async function getPeople(): Promise<PersonPreview[]> {
  const { data } = await api.get<PersonPreview[]>("/api/people");
  return data;
}

// ---------------------------------------------------------------------------
// Encounter endpoints
// ---------------------------------------------------------------------------

export interface CreateEncounterPayload {
  audio: Blob;
  embedding: number[];
}

export interface CreateEncounterResponse {
  person: Person;
  encounter: Encounter;
}

export async function createEncounter(
  payload: CreateEncounterPayload
): Promise<CreateEncounterResponse> {
  const formData = new FormData();
  const token = localStorage.getItem('pf_token');

  formData.append("audio", payload.audio, "recording.webm");
  formData.append(
    "embedding",
    JSON.stringify(payload.embedding)
  );

  // Debug logs
  console.log("Sending encounter:");

  for (const [key, value] of formData.entries()) {
    console.log(key, value);
  }

  const { data } = await api.post<CreateEncounterResponse>(
    "/api/encounters",
    formData,
    {
      headers: {
        "Content-Type": undefined,
        "Authorization": `Bearer ${token}`,
      },
    }
  );

  return data;
}

export default api;
