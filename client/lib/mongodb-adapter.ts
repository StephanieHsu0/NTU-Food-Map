import type { Adapter } from '@auth/core/adapters';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';

export function MongoDBAdapter(): Adapter {
  return {
    async createUser(user) {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      
      const newUser = {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await usersCollection.insertOne(newUser);
      return {
        id: result.insertedId.toString(),
        ...newUser,
      } as any;
    },
    
    async getUser(id) {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(id) });
      if (!user) return null;
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      } as any;
    },
    
    async getUserByEmail(email) {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      const user = await usersCollection.findOne({ email });
      if (!user) return null;
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      } as any;
    },
    
    async getUserByAccount({ providerAccountId, provider }) {
      const db = await connectToDatabase();
      const accountsCollection = db.collection('accounts');
      const account = await accountsCollection.findOne({
        provider,
        providerAccountId,
      });
      if (!account) return null;
      
      const usersCollection = db.collection('users');
      const userId = typeof account.userId === 'string' ? new ObjectId(account.userId) : account.userId;
      const user = await usersCollection.findOne({ _id: userId });
      if (!user) return null;
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
      } as any;
    },
    
    async updateUser(user) {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { _id: new ObjectId(user.id) },
        {
          $set: {
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
            image: user.image,
            updatedAt: new Date(),
          },
        }
      );
      return user;
    },
    
    async linkAccount(account) {
      const db = await connectToDatabase();
      const accountsCollection = db.collection('accounts');
      const userId = typeof account.userId === 'string' ? new ObjectId(account.userId) : account.userId;
      await accountsCollection.insertOne({
        userId: userId,
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token,
        access_token: account.access_token,
        expires_at: account.expires_at,
        token_type: account.token_type,
        scope: account.scope,
        id_token: account.id_token,
        session_state: account.session_state,
      });
      return account;
    },
    
    async createSession({ sessionToken, userId, expires }) {
      const db = await connectToDatabase();
      const sessionsCollection = db.collection('sessions');
      const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
      await sessionsCollection.insertOne({
        sessionToken,
        userId: userIdObj,
        expires,
      });
      return {
        sessionToken,
        userId: userId,
        expires,
      } as any;
    },
    
    async getSessionAndUser(sessionToken) {
      const db = await connectToDatabase();
      const sessionsCollection = db.collection('sessions');
      const session = await sessionsCollection.findOne({ sessionToken });
      if (!session) return null;
      
      const usersCollection = db.collection('users');
      const userId = typeof session.userId === 'string' ? new ObjectId(session.userId) : session.userId;
      const user = await usersCollection.findOne({ _id: userId });
      if (!user) return null;
      
      return {
        session: {
          sessionToken: session.sessionToken,
          userId: session.userId.toString(),
          expires: session.expires,
        } as any,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          image: user.image,
        } as any,
      };
    },
    
    async updateSession({ sessionToken, ...data }) {
      const db = await connectToDatabase();
      const sessionsCollection = db.collection('sessions');
      await sessionsCollection.updateOne(
        { sessionToken },
        { $set: { ...data } }
      );
      return {
        sessionToken,
        ...data,
      } as any;
    },
    
    async deleteSession(sessionToken) {
      const db = await connectToDatabase();
      const sessionsCollection = db.collection('sessions');
      await sessionsCollection.deleteOne({ sessionToken });
    },
  };
}
