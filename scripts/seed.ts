import { pool } from '../src/db/pool';

async function q(text: string, params: any[] = []) {
  return pool.query(text, params);
}

let seedPharmacyId = '';

async function getOrCreateMedicine(m: any): Promise<string> {
  const existing = await q(
    'SELECT id FROM medicines WHERE pharmacy_id=$1 AND name=$2 AND strength=$3 AND dosage_form=$4 AND pack_size=$5',
    [seedPharmacyId, m.name, m.strength, m.dosage_form, m.pack_size],
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const res = await q(
    `INSERT INTO medicines (pharmacy_id, name, strength, dosage_form, pack_size, reorder_level, notes, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [seedPharmacyId, m.name, m.strength, m.dosage_form, m.pack_size, m.reorder_level, m.notes ?? null, true],
  );
  return res.rows[0].id;
}

async function getOrCreateBatch(medicineId: string, b: any, performedBy: string): Promise<string> {
  const existing = await q('SELECT id FROM batches WHERE pharmacy_id=$1 AND medicine_id=$2 AND batch_number=$3', [seedPharmacyId, medicineId, b.batch_number]);
  if (existing.rows[0]) return existing.rows[0].id;
  const res = await q(
    `INSERT INTO batches (pharmacy_id, medicine_id, batch_number, expiry_date, quantity_packs) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [seedPharmacyId, medicineId, b.batch_number, b.expiry_date, b.quantity_packs],
  );
  const batchId = res.rows[0].id;
  if (b.quantity_packs > 0) {
    await q(
      `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by)
       VALUES ($1,$2,'receipt',$3,'Opening stock (seed)',$4)`,
      [seedPharmacyId, batchId, b.quantity_packs, performedBy],
    );
  }
  return batchId;
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const seedUserId = '00000000-0000-0000-0000-000000000001';
  const pharmacy = await q(
    `INSERT INTO pharmacies (name, license_number, owner_id) VALUES ('Seed Demo Pharmacy','SEED-DEMO-PHARMACY',$1)
     ON CONFLICT (license_number) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [seedUserId],
  );
  seedPharmacyId = pharmacy.rows[0].id;
  await q(
    `INSERT INTO profiles (id, full_name, role, pharmacy_id) VALUES ($1,'Seed Admin','admin',$2)
     ON CONFLICT (id) DO UPDATE SET pharmacy_id = EXCLUDED.pharmacy_id`,
    [seedUserId, seedPharmacyId],
  );

  const medicines = [
    { name: 'Paracetamol', strength: '500mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 5, notes: 'Seed demo data' },
    { name: 'Paracetamol', strength: '250mg/5ml', dosage_form: 'syrup', pack_size: 1, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Amoxicillin', strength: '500mg', dosage_form: 'capsule', pack_size: 10, reorder_level: 4, notes: 'Seed demo data' },
    { name: 'Amoxicillin', strength: '250mg/5ml', dosage_form: 'suspension', pack_size: 1, reorder_level: 2, notes: 'Seed demo data' },
    { name: 'Ibuprofen', strength: '400mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 5, notes: 'Seed demo data' },
    { name: 'Metformin', strength: '500mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 6, notes: 'Seed demo data' },
    { name: 'Amlodipine', strength: '5mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 4, notes: 'Seed demo data' },
    { name: 'Amlodipine', strength: '10mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Losartan', strength: '50mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 4, notes: 'Seed demo data' },
    { name: 'Omeprazole', strength: '20mg', dosage_form: 'capsule', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Cetirizine', strength: '10mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 4, notes: 'Seed demo data' },
    { name: 'Loratadine', strength: '10mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Ciprofloxacin', strength: '500mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Azithromycin', strength: '500mg', dosage_form: 'tablet', pack_size: 3, reorder_level: 2, notes: 'Seed demo data' },
    { name: 'Doxycycline', strength: '100mg', dosage_form: 'capsule', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Metronidazole', strength: '400mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Ranitidine', strength: '150mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Aspirin', strength: '75mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 4, notes: 'Seed demo data' },
    { name: 'Clopidogrel', strength: '75mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
    { name: 'Atorvastatin', strength: '20mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 4, notes: 'Seed demo data' },
    { name: 'Glibenclamide', strength: '5mg', dosage_form: 'tablet', pack_size: 10, reorder_level: 3, notes: 'Seed demo data' },
  ];

  const ids: Record<string, string> = {};
  for (const m of medicines) {
    const key = `${m.name}|${m.strength}`;
    ids[key] = await getOrCreateMedicine(m);
  }

  const batchDefs: Array<{ med: string; batch_number: string; expiry_offset_days: number; qty: number }> = [];
  batchDefs.push({ med: 'Paracetamol|500mg', batch_number: 'PCT-001', expiry_offset_days: 365, qty: 50 });
  batchDefs.push({ med: 'Paracetamol|500mg', batch_number: 'PCT-002', expiry_offset_days: 180, qty: 20 });
  batchDefs.push({ med: 'Ibuprofen|400mg', batch_number: 'IBU-001', expiry_offset_days: 300, qty: 40 });
  batchDefs.push({ med: 'Metformin|500mg', batch_number: 'MET-001', expiry_offset_days: 200, qty: 60 });
  batchDefs.push({ med: 'Amlodipine|5mg', batch_number: 'AML5-001', expiry_offset_days: 250, qty: 35 });
  batchDefs.push({ med: 'Losartan|50mg', batch_number: 'LOS-001', expiry_offset_days: 280, qty: 30 });
  batchDefs.push({ med: 'Omeprazole|20mg', batch_number: 'OMP-001', expiry_offset_days: 220, qty: 25 });
  batchDefs.push({ med: 'Cetirizine|10mg', batch_number: 'CET-001', expiry_offset_days: 400, qty: 45 });
  batchDefs.push({ med: 'Loratadine|10mg', batch_number: 'LOR-001', expiry_offset_days: 350, qty: 30 });
  batchDefs.push({ med: 'Atorvastatin|20mg', batch_number: 'ATO-001', expiry_offset_days: 260, qty: 40 });
  batchDefs.push({ med: 'Amoxicillin|500mg', batch_number: 'AMX-001', expiry_offset_days: 120, qty: 2 });
  batchDefs.push({ med: 'Amlodipine|10mg', batch_number: 'AML10-001', expiry_offset_days: 150, qty: 1 });
  batchDefs.push({ med: 'Azithromycin|500mg', batch_number: 'AZI-001', expiry_offset_days: 90, qty: 1 });
  batchDefs.push({ med: 'Clopidogrel|75mg', batch_number: 'CLO-001', expiry_offset_days: 100, qty: 2 });
  batchDefs.push({ med: 'Glibenclamide|5mg', batch_number: 'GLI-001', expiry_offset_days: 80, qty: 1 });
  batchDefs.push({ med: 'Ciprofloxacin|500mg', batch_number: 'CIP-001', expiry_offset_days: 60, qty: 0 });
  batchDefs.push({ med: 'Doxycycline|100mg', batch_number: 'DOX-001', expiry_offset_days: 20, qty: 15 });
  batchDefs.push({ med: 'Metronidazole|400mg', batch_number: 'METR-001', expiry_offset_days: 45, qty: 12 });
  batchDefs.push({ med: 'Ranitidine|150mg', batch_number: 'RAN-001', expiry_offset_days: -10, qty: 8 });
  batchDefs.push({ med: 'Paracetamol|250mg/5ml', batch_number: 'PCT-SYR-001', expiry_offset_days: 100, qty: 5 });
  batchDefs.push({ med: 'Paracetamol|250mg/5ml', batch_number: 'PCT-SYR-002', expiry_offset_days: 10, qty: 3 });
  batchDefs.push({ med: 'Amoxicillin|250mg/5ml', batch_number: 'AMX-SUS-001', expiry_offset_days: 150, qty: 4 });

  const filteredBatches = batchDefs; // keep all

  for (const b of filteredBatches) {
    const medId = ids[b.med];
    if (!medId) continue;
    await getOrCreateBatch(medId, { batch_number: b.batch_number, expiry_date: daysFromNow(b.expiry_offset_days), quantity_packs: b.qty }, seedUserId);
  }

  // Movements history (idempotent: skip if already seeded)
  const alreadySeeded = await q(
    "SELECT 1 FROM stock_movements WHERE pharmacy_id=$1 AND batch_id IN (SELECT id FROM batches WHERE pharmacy_id=$1 AND batch_number='PCT-001') AND reason='Dispensing (seed)' LIMIT 1",
    [seedPharmacyId],
  );
  if (!alreadySeeded.rows[0]) {
    const pctBatch = await q("SELECT id, quantity_packs FROM batches WHERE pharmacy_id=$1 AND batch_number='PCT-001'", [seedPharmacyId]);
    if (pctBatch.rows[0]) {
      const bid = pctBatch.rows[0].id;
      const cur = pctBatch.rows[0].quantity_packs;
      if (cur >= 5) {
        await q(
          `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by, created_at)
           VALUES ($1,$2,'issue',$3,'Dispensing (seed)',$4, now() - interval '7 days')`,
          [seedPharmacyId, bid, -5, seedUserId],
        );
        await q('UPDATE batches SET quantity_packs = quantity_packs - 5 WHERE id = $1', [bid]);
      }
      await q(
          `INSERT INTO stock_movements (pharmacy_id, batch_id, movement_type, quantity_packs, reason, performed_by, created_at)
         VALUES ($1,$2,'adjustment',$3,'Stock count correction (seed)',$4, now() - interval '3 days')`,
        [seedPharmacyId, bid, -2, seedUserId],
      );
      await q('UPDATE batches SET quantity_packs = quantity_packs - 2 WHERE id = $1', [bid]);
    }
  }

  console.log('Seed complete.');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
