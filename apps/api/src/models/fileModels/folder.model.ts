import { model, Schema, Types } from "mongoose"

export interface folderSchema {
    organization?:string,
    user?:string,
    name: string,
    size: string,
    parent?:string
}

export interface folderInput extends folderSchema , Document{

}

const folderSchema= new Schema<folderInput>({
    user:{
        type:Types.ObjectId,
        ref:'User'
    },
    organization:{
        type:Types.ObjectId,
        ref:'Organization'
    },
    name:{
        type:String,
        required:true
    },
    size:{
        type:String,
        required:true
    },
    parent:{
        type:Types.ObjectId,
        ref:'Folder'
    }
})

export const Folder = model<folderInput>('Folder',folderSchema)

