from typing import Any
from pydantic import BaseModel


class Recipient(BaseModel):
    type: str
    country: str
    pix_key: str | None = None
    clabe: str | None = None
    card_number: str | None = None
    expiry: str | None = None
    wallet_id: str | None = None
    provider: str | None = None


class BaseGateway:
    name: str

    def send_payout(self, recipient: Recipient) -> str:
        raise NotImplementedError


class PIXGateway(BaseGateway):
    name = "PIX"

    def send_payout(self, recipient: Recipient) -> str:
        return f"tx_PIX_{recipient.pix_key}_BR"


class SPEIGateway(BaseGateway):
    name = "SPEI"

    def send_payout(self, recipient: Recipient) -> str:
        return f"tx_SPEI_{recipient.clabe}_MX"


class VisaDirectGateway(BaseGateway):
    name = "VisaDirect"

    def send_payout(self, recipient: Recipient) -> str:
        return f"tx_VISA_{recipient.card_number}_US"


class MastercardSendGateway(BaseGateway):
    name = "MastercardSend"

    def send_payout(self, recipient: Recipient) -> str:
        return f"tx_MC_{recipient.card_number}_US"


class WalletGateway(BaseGateway):
    def __init__(self, provider: str):
        self.name = provider

    def send_payout(self, recipient: Recipient) -> str:
        return f"tx_WALLET_{recipient.wallet_id}_{recipient.country}"


class FallbackGateway(BaseGateway):
    name = "Fallback"

    def send_payout(self, recipient: Recipient) -> str:
        return f"tx_FALLBACK_{recipient.country}"


class GatewayRegistry:
    @staticmethod
    def select_gateway(recipient: Recipient) -> BaseGateway:
        if recipient.type == "bank":
            if recipient.country == "BR" and recipient.pix_key:
                return PIXGateway()
            elif recipient.country == "MX" and recipient.clabe:
                return SPEIGateway()
        elif recipient.type == "debit_card":
            if recipient.card_number and recipient.expiry:
                return VisaDirectGateway()
        elif recipient.type == "wallet":
            if recipient.wallet_id and recipient.provider:
                return WalletGateway(recipient.provider)

        return FallbackGateway()