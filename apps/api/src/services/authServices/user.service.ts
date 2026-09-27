import jwtService from '@/services/authServices/auth.service';
import User, { accountType, userSchema } from '@/models/authModels/user.model';

export const createUser = async (user: userSchema) => {
  const isExisting = await User.findOne({ email: user.email });
  if (!isExisting) {
    const newUser = await User.create(user);
    newUser.save();
    return newUser;
  }
  const token = await jwtService.findandreissueToken(isExisting!.email);
  isExisting!.access_token = token!;
  return isExisting;
};

type FindUserCriteria = {
  id?: string;
  email?: string;
};

export const findUser = async ({ id, email }: FindUserCriteria) => {
  let user = null;
  let query: any = {};
  if (email) {
    query.email = email;
  }
  if (id) {
    query._id = id;
  }

  user = await User.findOne(query);
  return user;
};

export const findUserForSignin = async (email: string) =>
  User.findOne({
    email: email.trim().toLowerCase(),
    accountType: accountType.Local,
  }).select('+password');

const userService = {
  createUser,
  findUser,
  findUserForSignin,
};

export default userService;
