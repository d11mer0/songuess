export class UnauthorizedError extends Error {
    constructor(message = 'Користувач не авторизований') {
        super(message);
        this.name = 'UnauthorizedError';
    }
}
