
export interface MarketConfig {
    country: string;
    label: string;
    length: number;
    type: 'numeric' | 'alphanumeric';
    placeholder?: string;
}

export const MarketMap: Record<string, MarketConfig> = {
    'ARS': {
        country: 'Argentina',
        label: 'CBU/CVU',
        length: 22,
        type: 'numeric',
        placeholder: '0000000000000000000000'
    },
    'USD': {
        country: 'USA',
        label: 'Routing / Account Number',
        length: 9, // Routing usually 9, Account varies. Map might need split logic later, but keeping simple as requested.
        type: 'numeric',
        placeholder: 'Routing (9) + Account'
    },
    'EUR': {
        country: 'Spain',
        label: 'IBAN',
        length: 24,
        type: 'alphanumeric',
        placeholder: 'ES12...'
    },
    'MXN': {
        country: 'Mexico',
        label: 'CLABE',
        length: 18,
        type: 'numeric',
        placeholder: '18 digits'
    },
    'BRL': {
        country: 'Brazil',
        label: 'PIX Key / CPF',
        length: 11,
        type: 'alphanumeric',
        placeholder: 'CPF or PIX Key'
    },
    'PEN': {
        country: 'Peru',
        label: 'CCI (Interbank Account)',
        length: 20,
        type: 'numeric',
        placeholder: '0011-...'
    }
};
