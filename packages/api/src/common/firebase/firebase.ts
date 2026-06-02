import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'node:fs';

let app: admin.app.App | null = null;

export function initFirebase(): admin.app.App {
  if (app) return app;

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    app = admin.initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'hc-dev' });
    return app;
  }

  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (saPath && existsSync(saPath)) {
    const serviceAccount = JSON.parse(readFileSync(saPath, 'utf-8'));
    app = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    // Application Default Credentials (Cloud Run / GCP)
    app = admin.initializeApp();
  }
  return app;
}

export function firebaseAuth(): admin.auth.Auth {
  return initFirebase().auth();
}
