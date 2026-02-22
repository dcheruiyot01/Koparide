// src/types/auth.ts

export interface User {
    id: string;
    name: string;
    email: string;
    // add any other fields your backend returns
}

export interface AuthResponse {
    user: User;
    token: string;
}
