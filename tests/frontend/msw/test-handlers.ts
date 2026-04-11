import { http, HttpResponse } from 'msw';

export type SignupScenario =
    | 'success'
    | 'success_with_corridor'
    | 'email_exists'
    | 'validation_error'
    | 'kyc_required'
    | 'server_error'
    | 'network_error';

let currentScenario: SignupScenario = 'success';

export const setSignupScenario = (s: SignupScenario) => {
    currentScenario = s;
};

export const handlers = [
    http.post('*/api/auth/signup', async ({ request }) => {
        const body = await request.json() as any;

        switch (currentScenario) {
            case 'success':
                return HttpResponse.json({ redirectCorridor: undefined, message: 'account_created' });
            case 'success_with_corridor':
                return HttpResponse.json({ redirectCorridor: 'corridor_XYZ', message: 'account_created' });
            case 'email_exists':
                return HttpResponse.json(
                    { error: 'email_exists', code: 'EMAIL_EXISTS', message: 'Email already registered' },
                    { status: 400 }
                );
            case 'validation_error':
                return HttpResponse.json(
                    {
                        error: 'validation_failed',
                        message: 'Invalid input',
                        details: { email: 'Invalid email', password: 'Too short' },
                    },
                    { status: 422 }
                );
            case 'kyc_required':
                return HttpResponse.json({ needsKyc: true, kycStatus: 'pending' });
            case 'server_error':
                return HttpResponse.json({ error: 'internal', message: 'Internal server error' }, { status: 500 });
            case 'network_error':
                return HttpResponse.error();
            default:
                return HttpResponse.json({ error: 'unhandled_scenario' }, { status: 500 });
        }
    }),
];
