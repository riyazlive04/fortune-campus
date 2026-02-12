-- Migration to enable user deletion by adding cascade constraints
-- This allows users to be deleted completely from the database

-- Drop existing foreign key constraints on leads table
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_createdById_fkey";
ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "leads_assignedToId_fkey";

-- Re-add foreign key constraints with proper onDelete behavior
ALTER TABLE "leads" 
  ADD CONSTRAINT "leads_createdById_fkey" 
  FOREIGN KEY ("createdById") 
  REFERENCES "users"("id") 
  ON DELETE CASCADE 
  ON UPDATE CASCADE;

ALTER TABLE "leads" 
  ADD CONSTRAINT "leads_assignedToId_fkey" 
  FOREIGN KEY ("assignedToId") 
  REFERENCES "users"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
