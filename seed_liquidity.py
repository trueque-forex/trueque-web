
import sqlite3
import os
import requests

RETAILERS = ['walmart_mx', 'oxxo_mx', 'soriana_mx', 'farmacias_similares_mx', 'coppel_mx']
for r in RETAILERS:
    res = requests.post(
        'http://127.0.0.1:8000/api/admin/liquidity/fund',
        headers={'X-Symmetri-Internal-Key': 'SECRET_ADMIN_KEY'},
        json={'retailer_id': r, 'amount': 500000, 'currency': 'MXN'}
    )
    print(f'Funded {r}: {res.status_code} {res.text}')

