// scripts/validate-env.ts
import { exit } from "process";

const requiredVars = ["DATABASE_URL", "PGUSER", "PGPASSWORD"];

const missing = requiredVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  missing.forEach((key) => console.error(`  - ${key}`));
  console.error("\nSet these in your .env file or shell before running migrations.\n");
  exit(1);
}

<<<<<<< HEAD
console.log("✅ All required environment variables are set.\n");
=======
console.log("✅ All required environment variables are set.\n");
>>>>>>> 6b1db87 (Initial commit for trueque_web independent repo)
