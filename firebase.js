import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

let database = null;

try {
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (databaseURL) {
    const app = initializeApp({ databaseURL, projectId }, 'SERVER_DB_APP');
    database = getDatabase(app);
  }
} catch {
  database = null;
}

export { database };
