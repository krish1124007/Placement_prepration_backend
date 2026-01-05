import type {Document} from "mongoose";


type datetopic = {
    date:string;
    topic:string;
}

type subject = {
    name:string;
    topics:datetopic[];

}


interface IPlan extends Document {

    aptitude?:datetopic[];
    dsa?:datetopic[];
    subject?:subject[];
    
}


export  type {
    IPlan
}