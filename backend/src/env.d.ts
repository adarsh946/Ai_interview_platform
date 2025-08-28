declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    BACKEND_URL: string;
    FRONTEND_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_CLIENT_SECRET: string;
    JWT_SECRET: string;
  }
}
