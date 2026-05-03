"""
test_core_fixes.py — Verifies that the 3 critical mock replacements work correctly.

Run with:
  cd c:\\Users\\werne\\Trueque\\trueque_web
  .venv\\Scripts\\activate
  APP_ENV=test pytest backend/tests/test_core_fixes.py -v
"""
import uuid
import pytest


class TestKMSEncryption:
    """Fix #1 — Real AES-256-GCM encryption, not base64."""

    def test_encrypt_produces_enc2_prefix(self, kms):
        result = kms.encrypt("123-45-6789")
        assert result.startswith("ENC2_"), "Expected AES-GCM encrypted value with ENC2_ prefix"

    def test_encrypt_decrypt_roundtrip(self, kms):
        plaintext = "sensitive-ssn-value"
        encrypted = kms.encrypt(plaintext)
        decrypted = kms.decrypt(encrypted, reason="test", user_id="test-user")
        assert decrypted == plaintext

    def test_legacy_enc_prefix_still_decrypts(self, kms):
        """Migration safety: old ENC_ base64 values still decrypt."""
        import base64
        legacy = "ENC_" + base64.b64encode(b"old-value").decode()
        result = kms.decrypt(legacy, reason="migration-test", user_id="test")
        assert result == "old-value"

    def test_no_plaintext_key_in_output(self, kms):
        result = kms.encrypt("my-secret")
        assert "my-secret" not in result
        assert "YELLOW SUBMARINE" not in result


class TestMatchEngineDB:
    """Fix #2 — Match engine is DB-backed, not in-memory dict."""

    def test_create_match_persists_to_db(self, db, match_service):
        user_a = str(uuid.uuid4())
        match = match_service.create_match(
            db=db,
            user_a_id=user_a,
            amount=500.00,
            source_currency="EUR",
            target_currency="MXN",
            exchange_rate=17.50,
        )
        assert match.id is not None
        assert match.status == "CREATED"
        assert match.user_a_status == "PENDING_FUNDING"

    def test_get_match_reads_from_db(self, db, match_service):
        user_a = str(uuid.uuid4())
        created = match_service.create_match(db=db, user_a_id=user_a, amount=100, source_currency="USD")
        fetched = match_service.get_match(db, str(created.id))
        assert fetched is not None
        assert fetched.id == created.id

    def test_update_funding_status(self, db, match_service):
        user_a = str(uuid.uuid4())
        match = match_service.create_match(db=db, user_a_id=user_a, amount=200, source_currency="EUR")
        updated = match_service.update_funding_status(db, str(match.id), "user_a", "FUNDED")
        assert updated.user_a_status == "FUNDED"

    def test_is_dual_funded_false_when_only_one_funded(self, db, match_service):
        user_a = str(uuid.uuid4())
        match = match_service.create_match(db=db, user_a_id=user_a, amount=200, source_currency="EUR")
        match_service.update_funding_status(db, str(match.id), "user_a", "FUNDED")
        assert match_service.is_dual_funded(db, str(match.id)) is False

    def test_release_match_sets_expired_status(self, db, match_service):
        user_a = str(uuid.uuid4())
        match = match_service.create_match(db=db, user_a_id=user_a, amount=50, source_currency="USD")
        match_service.release_match(db, str(match.id))
        expired = match_service.get_match(db, str(match.id))
        assert expired.status == "EXPIRED_RELEASED"


class TestSettlementGateways:
    """Fix #3 — settle_dual_payment uses GatewayRegistry, not MockGateway."""

    def test_sandbox_settlement_returns_payout_ids(self):
        from backend.utils.settle_utils import settle_dual_payment
        result = settle_dual_payment(
            tx_id_a="txA",
            tx_id_b="txB",
            recipient_a={"type": "bank", "country": "MX", "clabe": "012345678901234567"},
            recipient_b={"type": "bank", "country": "BR", "pix_key": "test@email.com"},
            amount_a=500.0,
            amount_b=8750.0,
            currency_a="EUR",
            currency_b="MXN",
        )
        assert "payout_a" in result
        assert "payout_b" in result
        assert result["sandbox"] is True
        assert result["gateway_a"] == "SPEI"
        assert result["gateway_b"] == "PIX"
