import jwtService from '@/services/authServices/auth.service';
import User, { userSchema } from '@/models/authModels/user.model';

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
  password?: string;
};

export const findUser = async ({ id, email, password }: FindUserCriteria) => {
  let user = null;
  let query: any = {};
  if (email) {
    query.email = email;
  }
  if (id) {
    query._id = id;
  }
  if (password) {
    query.password = password;
  }

  user = await User.findOne(query).select('+password');
  return user;
};

const userService = {
  createUser,
  findUser,
};

export default userService;
