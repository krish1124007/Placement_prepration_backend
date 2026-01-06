import type { Document } from "mongoose";


type datetopic = {
    date: string;
    topic: string;
    competition?: boolean;
}

type subject = {
    name: string;
    topics: datetopic[];
    competition?: boolean;
}


interface IPlan extends Document {

    aptitude?: datetopic[];
    dsa?: datetopic[];
    subject?: subject[];

}


export type {
    IPlan
}