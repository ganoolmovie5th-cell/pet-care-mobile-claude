import {
  createPlaydatePost,
  getAllActivePosts,
  getPlaydatePost,
  updatePlaydatePost,
  addInterestedOwner,
  removeInterestedOwner,
  createPlaydateChat,
  getPlaydateChatsByPost,
  getPlaydateChat,
  addMessageToChat,
} from '../src/services/playdate';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Playdate E2E Flow', () => {
  beforeEach(async () => {
    // Clear AsyncStorage cache before each test
    await AsyncStorage.removeItem('playdate_posts_all').catch(() => {});
  });

  describe('Post Creation & Discovery', () => {
    it('should create a post and include it in active posts', async () => {
      const postData = {
        ownerId: 'e2e-user-001',
        petId: 'e2e-pet-001',
        petName: 'Buddy',
        breed: 'Golden Retriever',
        age: 3,
        location: {
          lat: -6.2088,
          lng: 106.8456,
          address: 'Senayan, Jakarta',
        },
        date: '2026-08-15',
        description: 'Friendly dog looking for playmates',
        interested_owners: [],
        status: 'active' as const,
      };

      const createdPost = await createPlaydatePost(postData);
      expect(createdPost.id).toBeDefined();

      const posts = await getAllActivePosts();
      const foundPost = posts.find(p => p.id === createdPost.id);
      expect(foundPost).toBeDefined();
      expect(foundPost?.petName).toBe('Buddy');
    });

    it('should show cache invalidation after creating post', async () => {
      // First fetch populates cache
      await getAllActivePosts();

      // Create new post should invalidate cache
      const postData = {
        ownerId: 'e2e-user-002',
        petId: 'e2e-pet-002',
        location: { lat: 0, lng: 0 },
        date: '2026-08-20',
        description: 'New post after cache',
        interested_owners: [],
        status: 'active' as const,
      };

      await createPlaydatePost(postData);

      // Fresh fetch should include new post
      const posts = await getAllActivePosts();
      const newPost = posts.find(p => p.ownerId === 'e2e-user-002');
      expect(newPost).toBeDefined();
    });
  });

  describe('Post Editing & Updates', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await createPlaydatePost({
        ownerId: 'e2e-user-003',
        petId: 'e2e-pet-003',
        location: { lat: -6.2088, lng: 106.8456 },
        date: '2026-08-25',
        description: 'Original description',
        interested_owners: [],
        status: 'active',
      });
      postId = post.id;
    });

    it('should update post description', async () => {
      await updatePlaydatePost(postId, {
        description: 'Updated description',
      });

      const updated = await getPlaydatePost(postId);
      expect(updated?.description).toBe('Updated description');
    });

    it('should invalidate cache on post update', async () => {
      // Populate cache
      await getPlaydatePost(postId);

      // Update post
      await updatePlaydatePost(postId, {
        description: 'Cache test',
      });

      // Fetch fresh post
      const fresh = await getPlaydatePost(postId);
      expect(fresh?.description).toBe('Cache test');
    });
  });

  describe('Interest Management Flow', () => {
    let postId: string;
    const interestedUserId = 'e2e-interested-user-001';

    beforeEach(async () => {
      const post = await createPlaydatePost({
        ownerId: 'e2e-post-owner',
        petId: 'e2e-pet-004',
        location: { lat: -6.2088, lng: 106.8456 },
        date: '2026-09-01',
        description: 'Test post for interests',
        interested_owners: [],
        status: 'active',
      });
      postId = post.id;
    });

    it('should add interested owner', async () => {
      await addInterestedOwner(postId, interestedUserId);
      const post = await getPlaydatePost(postId);
      expect(post?.interested_owners).toContain(interestedUserId);
    });

    it('should prevent duplicate interested owners', async () => {
      await addInterestedOwner(postId, interestedUserId);
      await addInterestedOwner(postId, interestedUserId);

      const post = await getPlaydatePost(postId);
      const count = post?.interested_owners.filter(id => id === interestedUserId).length;
      expect(count).toBe(1);
    });

    it('should remove interested owner', async () => {
      await addInterestedOwner(postId, interestedUserId);
      await removeInterestedOwner(postId, interestedUserId);

      const post = await getPlaydatePost(postId);
      expect(post?.interested_owners).not.toContain(interestedUserId);
    });
  });

  describe('Chat Flow', () => {
    let postId: string;
    const postOwnerId = 'e2e-post-owner-chat';
    const interestedOwnerId = 'e2e-interested-owner-chat';

    beforeEach(async () => {
      const post = await createPlaydatePost({
        ownerId: postOwnerId,
        petId: 'e2e-pet-005',
        location: { lat: -6.2088, lng: 106.8456 },
        date: '2026-09-05',
        description: 'Post for chat testing',
        interested_owners: [interestedOwnerId],
        status: 'active',
      });
      postId = post.id;
    });

    it('should create chat with initial message', async () => {
      const chat = await createPlaydateChat(
        postId,
        postOwnerId,
        interestedOwnerId,
        'Hi! Interested in your playdate!'
      );

      expect(chat.id).toBeDefined();
      expect(chat.postId).toBe(postId);
      expect(chat.ownerId).toBe(postOwnerId);
      expect(chat.interestedOwnerId).toBe(interestedOwnerId);
      expect(chat.messages).toHaveLength(1);
      expect(chat.messages[0].text).toBe('Hi! Interested in your playdate!');
    });

    it('should retrieve chat and add messages', async () => {
      const chat = await createPlaydateChat(
        postId,
        postOwnerId,
        interestedOwnerId,
        'Initial message'
      );

      await addMessageToChat(chat.id, interestedOwnerId, 'How about Sunday?');

      const updated = await getPlaydateChat(chat.id);
      expect(updated?.messages).toHaveLength(2);
      expect(updated?.messages[1].text).toBe('How about Sunday?');
      expect(updated?.messages[1].sender).toBe(interestedOwnerId);
    });

    it('should list chats for a post', async () => {
      const chat1 = await createPlaydateChat(postId, postOwnerId, interestedOwnerId, 'Chat 1');
      const chat2 = await createPlaydateChat(
        postId,
        postOwnerId,
        'other-interested-user',
        'Chat 2'
      );

      const chats = await getPlaydateChatsByPost(postId);
      expect(chats.length).toBeGreaterThanOrEqual(2);
      expect(chats.map(c => c.id)).toContain(chat1.id);
      expect(chats.map(c => c.id)).toContain(chat2.id);
    });

    it('should invalidate chat cache on message add', async () => {
      const chat = await createPlaydateChat(
        postId,
        postOwnerId,
        interestedOwnerId,
        'Start message'
      );

      // Populate cache
      await getPlaydateChat(chat.id);

      // Add message
      await addMessageToChat(chat.id, postOwnerId, 'Reply message');

      // Fresh fetch
      const updated = await getPlaydateChat(chat.id);
      expect(updated?.messages).toHaveLength(2);
    });
  });

  describe('Cache Behavior', () => {
    it('should return cached posts on second fetch', async () => {
      const posts1 = await getAllActivePosts();
      const posts2 = await getAllActivePosts();

      expect(posts1).toEqual(posts2);
    });

    it('should clear cache when invalidated', async () => {
      await getAllActivePosts();

      const newPost = await createPlaydatePost({
        ownerId: 'cache-test-user',
        petId: 'cache-test-pet',
        location: { lat: 0, lng: 0 },
        date: '2026-09-10',
        description: 'Cache invalidation test',
        interested_owners: [],
        status: 'active',
      });

      const posts = await getAllActivePosts();
      expect(posts.some(p => p.id === newPost.id)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing post gracefully', async () => {
      const post = await getPlaydatePost('non-existent-post-id');
      expect(post).toBeNull();
    });

    it('should handle missing chat gracefully', async () => {
      const chat = await getPlaydateChat('non-existent-chat-id');
      expect(chat).toBeNull();
    });

    it('should throw on invalid post operations', async () => {
      await expect(
        addInterestedOwner('non-existent-post', 'some-user')
      ).rejects.toThrow();
    });

    it('should throw on invalid chat operations', async () => {
      await expect(
        addMessageToChat('non-existent-chat', 'some-user', 'message')
      ).rejects.toThrow();
    });
  });
});
