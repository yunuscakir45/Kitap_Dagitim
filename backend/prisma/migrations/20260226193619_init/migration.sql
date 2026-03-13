-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "labelNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentHolderStudentId" INTEGER,
    CONSTRAINT "Book_currentHolderStudentId_fkey" FOREIGN KEY ("currentHolderStudentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "distributedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdBy" TEXT
);

-- CreateTable
CREATE TABLE "DistributionItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "distributionId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "fromStudentId" INTEGER,
    "toStudentId" INTEGER NOT NULL,
    CONSTRAINT "DistributionItem_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DistributionItem_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DistributionItem_fromStudentId_fkey" FOREIGN KEY ("fromStudentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DistributionItem_toStudentId_fkey" FOREIGN KEY ("toStudentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceSnapshot" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "distributionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "AttendanceSnapshot_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceSnapshot_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "bookId" INTEGER NOT NULL,
    "distributionId" INTEGER,
    "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReadingHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReadingHistory_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReadingHistory_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
