TOLERANCE_BY_COUNTRY = {
    # 🇨🇴 Colombia
    "CO": {
        "amount_tolerance": 20000,     # COP
        "rate_tolerance": 0.01         # ±1%
    },
    # 🇲🇽 Mexico
    "MX": {
        "amount_tolerance": 100,       # MXN
        "rate_tolerance": 0.008
    },
    # 🇧🇷 Brazil
    "BR": {
        "amount_tolerance": 10,        # BRL
        "rate_tolerance": 0.008
    },
    # 🇦🇷 Argentina
    "AR": {
        "amount_tolerance": 5000,      # ARS
        "rate_tolerance": 0.015        # Wider due to volatility
    },
    # 🇻🇪 Venezuela
    "VE": {
        "amount_tolerance": 1000000,   # VES (Bolívar)
        "rate_tolerance": 0.02         # Wider due to extreme FX swings
    },
    # 🇺🇸 United States
    "US": {
        "amount_tolerance": 5,         # USD
        "rate_tolerance": 0.005
    },
    # 🇪🇸 Spain
    "ES": {
        "amount_tolerance": 5,         # EUR
        "rate_tolerance": 0.005
    }
}