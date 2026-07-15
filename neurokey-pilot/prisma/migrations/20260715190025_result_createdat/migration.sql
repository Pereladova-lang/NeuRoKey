-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessionResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "accuracy" REAL NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "scoresJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SessionResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SessionResult_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SessionResult" ("accuracy", "durationSec", "exerciseId", "id", "scoresJson", "sessionId") SELECT "accuracy", "durationSec", "exerciseId", "id", "scoresJson", "sessionId" FROM "SessionResult";
DROP TABLE "SessionResult";
ALTER TABLE "new_SessionResult" RENAME TO "SessionResult";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
