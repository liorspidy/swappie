export interface IStatuses {
    message: string;
    type: "success" | "error";
}

export interface ISongDetails {
    title: string;
    author: string;
    year?: string;
}