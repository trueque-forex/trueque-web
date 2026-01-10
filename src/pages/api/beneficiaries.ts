// src/pages/api/beneficiaries.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/server/db';
import { withAuth } from '@/lib/withAuth';
import { TruequeSession } from '@/types/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = (req as any).session as TruequeSession;

    // DEBUG: Inspect session content
    console.log('[BENEFICIARIES] Session User:', session.user.email);

    const actor = { userId: session.user.id };

    // POST: Create new beneficiary
    if (req.method === 'POST') {
        const body = req.body;
        if (!body || !body.method || !body.identifiers) {
            return res.status(400).json({ error: 'method and identifiers required' });
        }

        const now = new Date().toISOString();
        const userId = parseInt(actor.userId, 10);

        // Construct Metadata JSON
        const metadata = {
            method: body.method,
            identifiers: {
                ...body.identifiers,
                // Ensure flat fields are preserved inside metadata for legacy views if needed
                email: body.identifiers.email,
                phone: body.identifiers.phone_number,
                bank_name: body.identifiers.bank_name,
                account_number: body.identifiers.account_number
            },
            country: body.country
        };

        const insertText = `
      INSERT INTO beneficiaries
        (owner_id, name, metadata, created_at)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

        const values = [
            userId, // Now passed as string/bigint, matches owner_id(bigint)
            body.name || 'Unknown',
            JSON.stringify(metadata),
            now,
        ];

        try {
            const { rows } = await query(insertText, values);
            const row = rows[0];
            const md = row.metadata || {};
            // Handle double-encoded JSON if driver returns string
            const parsedMd = typeof md === 'string' ? JSON.parse(md) : md;

            return res.status(201).json({
                id: String(row.id),
                user_id: String(row.owner_id),
                name: row.name,
                country: parsedMd.country || 'US',
                method: parsedMd.method || 'unknown',
                identifiers: parsedMd.identifiers || {},
                status: 'approved',
                created_at: row.created_at
            });
        } catch (e: any) {
            console.error('beneficiaries.POST error', e);
            return res.status(500).json({ error: 'internal_error' });
        }
    }

    // GET: List beneficiaries
    if (req.method === 'GET') {
        const userId = parseInt(actor.userId, 10);
        const { method } = req.query;

        const selectText = `
        SELECT * FROM beneficiaries 
        WHERE owner_id = $1 
        ORDER BY created_at DESC
    `;

        try {
            const { rows } = await query(selectText, [userId]);

            const mappedRows = rows.map((row: any) => {
                let md = row.metadata || {};
                if (typeof md === 'string') {
                    try { md = JSON.parse(md); } catch (e) { }
                }

                // Fallback for Legacy/Flat Rows
                const method = md.method || (row.bank_name ? 'bank_rtp' : 'unknown');
                const identifiers = md.identifiers || {
                    email: row.email,
                    phone_number: row.phone_number,
                    bank_name: row.bank_name,
                    account_number: row.account_number,
                    account_type: row.account_type,
                };

                return {
                    id: String(row.id),
                    user_id: String(row.owner_id),
                    name: row.name,
                    country: md.country || row.country || 'US',
                    method: method,
                    identifiers: identifiers,
                    saved_methods: md.saved_methods,
                    status: 'approved',
                    created_at: row.created_at
                };
            });

            return res.status(200).json(mappedRows);
        } catch (e: any) {
            console.error('beneficiaries.GET error', e);
            return res.status(500).json({ error: 'internal_error' });
        }
    }

    // PUT: Update existing beneficiary (e.g. adding a new method)
    if (req.method === 'PUT') {
        const body = req.body;
        if (!body || !body.id || !body.method || !body.identifiers) {
            return res.status(400).json({ error: 'id, method, and identifiers required' });
        }

        const userId = parseInt(actor.userId, 10);
        const beneficiaryId = body.id;

        // 1. Fetch Existing
        const selectText = `SELECT * FROM beneficiaries WHERE id = $1 AND owner_id = $2`;
        const { rows } = await query(selectText, [beneficiaryId, userId]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Beneficiary not found' });
        }

        const existingRow = rows[0];
        let md = existingRow.metadata || {};
        if (typeof md === 'string') {
            try { md = JSON.parse(md); } catch (e) { }
        }

        // 2. Update/Merge Metadata
        // Ensure 'saved_methods' structure exists
        if (!md.saved_methods) {
            md.saved_methods = {};
            // Migration: Move current root method to saved_methods if valid
            if (md.method && md.identifiers) {
                md.saved_methods[md.method] = md.identifiers;
            } else if (existingRow.bank_name) {
                // LEGACY MIGRATION: Record has no metadata method, but has legacy columns.
                // We must save this as 'bank_rtp' before overwriting root.
                md.saved_methods['bank_rtp'] = {
                    email: existingRow.email,
                    phone_number: existingRow.phone_number,
                    bank_name: existingRow.bank_name,
                    account_number: existingRow.account_number,
                    cbu: existingRow.cbu || existingRow.account_identifier, // Heuristic
                    account_type: existingRow.account_type,
                    country: existingRow.country
                };
            }
        }

        // Add/Update the specific method being saved
        md.saved_methods[body.method] = body.identifiers;

        // Also update the "Last Used" / Top-level fields for backward compatibility
        md.method = body.method;
        md.identifiers = body.identifiers;

        // 3. Save Back
        const updateText = `
            UPDATE beneficiaries 
            SET metadata = $1, 
                name = $2 
            WHERE id = $3 AND owner_id = $4
            RETURNING *
        `;

        // Update name if provided, else keep existing
        const newName = body.name || existingRow.name;

        try {
            const { rows: updatedRows } = await query(updateText, [
                JSON.stringify(md),
                newName,
                beneficiaryId,
                userId
            ]);

            const row = updatedRows[0];
            // Start using the saved_methods structure in response
            // (Client filters this list anyway)
            return res.status(200).json({
                id: String(row.id),
                user_id: String(row.owner_id),
                name: row.name,
                country: md.country || 'US',
                method: md.method,
                identifiers: md.identifiers,
                saved_methods: md.saved_methods, // New Field
                status: 'approved',
                created_at: row.created_at
            });
        } catch (e: any) {
            console.error('beneficiaries.PUT error', e);
            return res.status(500).json({ error: 'internal_error' });
        }
    }

    res.setHeader('Allow', 'GET,POST,PUT');
    return res.status(405).end();
}

export default withAuth(handler);
