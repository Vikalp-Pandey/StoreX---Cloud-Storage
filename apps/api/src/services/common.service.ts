import mongoose, { Model } from 'mongoose';

export const findInstance = async <T>(
  model: Model<T>,
  field: keyof T | string,
  value: any,
) => {
  return await model.find({ [field]: value }).exec();
};

export const findObject = async <T>(
  model: Model<T>,
  filter: Partial<Record<keyof T | '_id', any>>,
) => {
  return await model.findOne(filter).exec();
};

const commonService = {
  findInstance,
  findObject,
};

export default commonService;
