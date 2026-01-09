// Simple singleton to hold the token
let csrfToken: string | null = null;

export const setCsrfToken = (token: string) => {
    csrfToken = token;
};

export const getCsrfToken = () => csrfToken;

// Wrapper for fetch that adds the CSRF header
export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers);

    if (csrfToken) {
        headers.set('x-csrf-token', csrfToken);
    }

    return fetch(input, {
        ...init,
        headers,
    });
};
