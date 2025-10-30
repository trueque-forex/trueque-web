export function logAuditEntry(entry) {
    console.log('[Audit]', JSON.stringify(entry, null, 2));
}
export function exportAuditLog(entries) {
    return entries.map(e => JSON.stringify(e)).join('\n');
}
