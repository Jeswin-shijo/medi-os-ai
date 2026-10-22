/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the MediOS API, including the /api prefix. */
  readonly VITE_API_URL?: string;
  /** Pins the clinic's "today" (YYYY-MM-DD); unset means the real date. */
  readonly VITE_CLINIC_DATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
