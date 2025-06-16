export type BaseUser = {
    id: number;
    login: string;
};

export type OptionalUserFields = {
    email?: string;
    avatar?: string;
    record?: number;
    password?: string;
    isVerified?: boolean;
    google_id?: string;
};

export type PartialUser = BaseUser & OptionalUserFields;