#!/usr/bin/node

import { v4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { getAuthHeader, getToken, hashPassword } from '../utils/utils';
import { decodeToken, getCredentials } from '../utils/utils';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = getAuthHeader(req);

    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = getToken(authHeader);

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decodedToken = decodeToken(token);
    if (!decodedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, password } = getCredentials(decodedToken);
    const user = await dbClient.getUser(email);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.password !== hashPassword(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accessToken = v4();

    await redisClient.set(`auth_${accessToken}`, user._id.toString('utf8'), 60 * 60 * 24);
    res.json({ token: accessToken });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = await redisClient.get(`auth_${token}`);
    if (!id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.getUserById(id);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    await redisClient.del(`auth_${token}`);
    res.status(204).end();
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = await redisClient.get(`auth_${token}`);

    if (!id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.getUserById(id);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return res.json({ id: user._id, email: user.email }).end();
  }
}

export default AuthController;
