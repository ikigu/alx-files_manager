import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    const existingUser = await dbClient.userExist(email);

    if (existingUser) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }

    const newUser = await dbClient.createUser(email, password);
    const id = `${newUser.insertedId}`;

    res.status(201).json({ id, email });
  }
}

export default UsersController;
