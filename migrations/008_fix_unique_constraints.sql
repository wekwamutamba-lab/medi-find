-- 008_fix_unique_constraints.sql
DELETE FROM medicines a
USING medicines b
WHERE a.id > b.id
  AND a.name = b.name
  AND a.strength = b.strength
  AND a.dosage_form = b.dosage_form
  AND a.pack_size = b.pack_size;

DELETE FROM batches a
USING batches b
WHERE a.id > b.id
  AND a.medicine_id = b.medicine_id
  AND a.batch_number = b.batch_number;

CREATE UNIQUE INDEX IF NOT EXISTS medicines_unique_identity_idx
  ON medicines (name, strength, dosage_form, pack_size);

CREATE UNIQUE INDEX IF NOT EXISTS batches_unique_identity_idx
  ON batches (medicine_id, batch_number);
