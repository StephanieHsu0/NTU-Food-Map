import type { Adapter } from 'next-auth/adapters';
import { ObjectId } from 'mongodb';
import { connectToDatabase } from './db';

export function MongoDBAdapter(): Adapter {
  return {
    async createUser(user) {
      try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        
        const newUser = {
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified || null,
          image: user.image || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const result = await usersCollection.insertOne(newUser);
        return {
          id: result.insertedId.toString(),
          name: newUser.name,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          image: newUser.image,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.createUser error:', error);
        throw error;
      }
    },
    
    async getUser(id) {
      try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!user) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified || null,
          image: user.image || null,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.getUser error:', error);
        throw error;
      }
    },
    
    async getUserByEmail(email) {
      try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email });
        if (!user) return null;
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified || null,
          image: user.image || null,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.getUserByEmail error:', error);
        throw error;
      }
    },
    
    async getUserByAccount({ providerAccountId, provider }) {
      try {
        const db = await connectToDatabase();
        const accountsCollection = db.collection('accounts');
        console.log('[MongoDBAdapter.getUserByAccount] query', { provider, providerAccountId });
        const account = await accountsCollection.findOne({
          provider,
          providerAccountId,
        });
        if (!account) {
          console.warn('[MongoDBAdapter.getUserByAccount] account not found', { provider, providerAccountId });
          return null;
        }
        
        const usersCollection = db.collection('users');
        const userId = typeof account.userId === 'string' ? new ObjectId(account.userId) : account.userId;
        const user = await usersCollection.findOne({ _id: userId });
        if (!user) {
          console.error('[MongoDBAdapter.getUserByAccount] user not found for account', { provider, providerAccountId, userId: account.userId });
          return null;
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified || null,
          image: user.image || null,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.getUserByAccount error:', error);
        throw error;
      }
    },
    
    async updateUser(user) {
      try {
        const db = await connectToDatabase();
        const usersCollection = db.collection('users');
        const updateData: any = {
          updatedAt: new Date(),
        };
        if (user.name !== undefined) updateData.name = user.name;
        if (user.email !== undefined) updateData.email = user.email;
        if (user.emailVerified !== undefined) updateData.emailVerified = user.emailVerified || null;
        if (user.image !== undefined) updateData.image = user.image || null;
        
        await usersCollection.updateOne(
          { _id: new ObjectId(user.id) },
          { $set: updateData }
        );
        
        // Fetch and return the updated user
        const updatedUser = await usersCollection.findOne({ _id: new ObjectId(user.id) });
        if (!updatedUser) {
          throw new Error('User not found after update');
        }
        return {
          id: updatedUser._id.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
          emailVerified: updatedUser.emailVerified || null,
          image: updatedUser.image || null,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.updateUser error:', error);
        throw error;
      }
    },
    
    async linkAccount(account) {
      try {
        const db = await connectToDatabase();
        const accountsCollection = db.collection('accounts');
        const userId = typeof account.userId === 'string' ? new ObjectId(account.userId) : account.userId;
        // Prevent linking the same providerAccountId to a different user
        const existing = await accountsCollection.findOne({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });
        if (existing) {
          const existingUserId = typeof existing.userId === 'string' ? existing.userId.toString() : existing.userId.toHexString();
          const incomingUserId = typeof userId === 'string' ? userId : (userId as any).toHexString();
          if (existingUserId !== incomingUserId) {
            console.error('[MongoDBAdapter.linkAccount] providerAccountId already linked to another user', {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              existingUserId,
              incomingUserId,
            });
            throw new Error('Account already linked to another user');
          }
          console.log('[MongoDBAdapter.linkAccount] account already linked to same user, skipping insert', {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            userId: incomingUserId,
          });
          return account;
        }
        await accountsCollection.insertOne({
          userId: userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token || null,
          access_token: account.access_token || null,
          expires_at: account.expires_at || null,
          token_type: account.token_type || null,
          scope: account.scope || null,
          id_token: account.id_token || null,
          session_state: account.session_state || null,
        });
        return account;
      } catch (error) {
        console.error('MongoDBAdapter.linkAccount error:', error);
        // If account already exists, return the account (idempotent)
        if ((error as any).code === 11000) {
          return account;
        }
        throw error;
      }
    },
    
    async createSession({ sessionToken, userId, expires }) {
      try {
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
          userId: userId.toString(),
          expires,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.createSession error:', error);
        throw error;
      }
    },
    
    async getSessionAndUser(sessionToken) {
      try {
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
            emailVerified: user.emailVerified || null,
            image: user.image || null,
          } as any,
        };
      } catch (error) {
        console.error('MongoDBAdapter.getSessionAndUser error:', error);
        throw error;
      }
    },
    
    async updateSession({ sessionToken, ...data }) {
      try {
        const db = await connectToDatabase();
        const sessionsCollection = db.collection('sessions');
        const updateData: any = { ...data };
        if (updateData.userId) {
          updateData.userId = typeof updateData.userId === 'string' 
            ? new ObjectId(updateData.userId) 
            : updateData.userId;
        }
        await sessionsCollection.updateOne(
          { sessionToken },
          { $set: updateData }
        );
        return {
          sessionToken,
          ...data,
        } as any;
      } catch (error) {
        console.error('MongoDBAdapter.updateSession error:', error);
        throw error;
      }
    },
    
    async deleteSession(sessionToken) {
      try {
        const db = await connectToDatabase();
        const sessionsCollection = db.collection('sessions');
        await sessionsCollection.deleteOne({ sessionToken });
      } catch (error) {
        console.error('MongoDBAdapter.deleteSession error:', error);
        throw error;
      }
    },
  };
}


