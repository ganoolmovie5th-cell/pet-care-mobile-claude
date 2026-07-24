import express from 'express';
import { verifyAuth } from '../middleware/auth';
import {
  createPlaydatePost,
  getPlaydatePost,
  updatePlaydatePost,
  getPlaydatePostsByOwner,
  getAllActivePosts,
  addInterestedOwner,
  removeInterestedOwner,
  createPlaydateChat,
  getPlaydateChatsByPost,
  getPlaydateChat,
  addMessageToChat,
} from '../services/playdate';

const router = express.Router();

// Posts CRUD
router.post('/posts', verifyAuth, async (req, res, next) => {
  try {
    const post = await createPlaydatePost({
      ...req.body,
      ownerId: (req as any).user.uid,
      interested_owners: [],
    });
    res.json({ id: post.id, created_at: post.created_at });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:postId', verifyAuth, async (req, res, next) => {
  try {
    const post = await getPlaydatePost(req.params.postId);
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err) {
    next(err);
  }
});

router.patch('/posts/:postId', verifyAuth, async (req, res, next) => {
  try {
    const post = await getPlaydatePost(req.params.postId);
    if (!post || post.ownerId !== (req as any).user.uid) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    await updatePlaydatePost(req.params.postId, req.body);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/owner/mine', verifyAuth, async (req, res, next) => {
  try {
    const posts = await getPlaydatePostsByOwner((req as any).user.uid);
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

router.get('/posts/active/all', verifyAuth, async (req, res, next) => {
  try {
    const posts = await getAllActivePosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// Interest
router.post('/posts/:postId/interested', verifyAuth, async (req, res, next) => {
  try {
    await addInterestedOwner(req.params.postId, (req as any).user.uid);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete('/posts/:postId/interested', verifyAuth, async (req, res, next) => {
  try {
    await removeInterestedOwner(req.params.postId, (req as any).user.uid);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Chat
router.post('/posts/:postId/chat/start', verifyAuth, async (req, res, next) => {
  try {
    const { interestedOwnerId, initialMessage } = req.body;
    const chat = await createPlaydateChat(req.params.postId, (req as any).user.uid, interestedOwnerId, initialMessage);
    res.json({ id: chat.id, created_at: chat.created_at });
  } catch (err) {
    next(err);
  }
});

router.get('/posts/:postId/chat', verifyAuth, async (req, res, next) => {
  try {
    const chats = await getPlaydateChatsByPost(req.params.postId);
    res.json(chats);
  } catch (err) {
    next(err);
  }
});

router.get('/chat/:chatId', verifyAuth, async (req, res, next) => {
  try {
    const chat = await getPlaydateChat(req.params.chatId);
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }
    res.json(chat);
  } catch (err) {
    next(err);
  }
});

router.post('/chat/:chatId/message', verifyAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    await addMessageToChat(req.params.chatId, (req as any).user.uid, text);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
