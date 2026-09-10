import { Document, Schema, Types, model } from 'mongoose';

export interface organizationSchema {
    user?:string,
    name: string,
    
}

export interface organizationInput extends organizationSchema , Document{

}

const organizationSchema= new Schema<organizationInput>({
    user:{
        type:Types.ObjectId,
        ref:'User'
    },
    name:{
        type:String,
        required:true
    }
    
})

export const Organization = model<organizationInput>('Organization',organizationSchema)